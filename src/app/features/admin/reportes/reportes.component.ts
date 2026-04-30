import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TooltipModule } from 'primeng/tooltip';
import { AdminService } from '../../../core/services/admin.service';
import { DimensionPillComponent } from '../../../shared/components/dimension-pill/dimension-pill.component';
import { InsercionCarrera, CompetenciaDemandada, KpiDashboard } from '../../../core/models';
import { CONVENIOS_POR_ZONA_MOCK, VACANTES_POR_AREA_MOCK } from '../../../shared/mocks/reportes.mock';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, ButtonModule, ChartModule, TooltipModule, DimensionPillComponent],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
})
export class ReportesComponent implements OnInit {
  kpis?: KpiDashboard;
  insercion: InsercionCarrera[]       = [];
  competencias: CompetenciaDemandada[] = [];
  loading = true;

  pieChartData: any    = {};
  pieChartOptions: any = {};
  barChartData2: any   = {};
  barChartOptions2: any = {};

  private adminSvc = inject(AdminService);

  ngOnInit() {
    this.adminSvc.getKpis().subscribe(k => this.kpis = k);
    this.adminSvc.getInsercionPorCarrera().subscribe(d => {
      this.insercion = d;
      this.buildPieChart();
    });
    this.adminSvc.getCompetenciasDemandadas().subscribe(d => {
      this.competencias = d;
      this.buildBarChart2(d);
      this.loading = false;
    });
  }

  private buildPieChart() {
    const z = CONVENIOS_POR_ZONA_MOCK;
    this.pieChartData = {
      labels: ['Zona Norte', 'Zona Centro', 'Zona Sur'],
      datasets: [{
        data: [z.norte, z.centro, z.sur],
        backgroundColor: ['#03837b', '#3b82f6', '#8b5cf6'],
        borderWidth: 0,
      }]
    };
    this.pieChartOptions = {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 12 }, color: '#6b7280', boxWidth: 12, padding: 16 } }
      }
    };
  }

  private buildBarChart2(data: CompetenciaDemandada[]) {
    this.barChartData2 = {
      labels: data.map(d => d.label),
      datasets: [
        {
          label: 'Demanda empresarial',
          data: data.map(d => d.demanda),
          backgroundColor: ['#0d9488', '#3b82f6', '#8b5cf6', '#f97316'],
          borderRadius: 8,
          borderSkipped: false,
        }
      ]
    };
    this.barChartOptions2 = {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          min: 0, max: 100,
          grid: { color: '#f0f0f0' },
          ticks: { font: { family: 'Inter', size: 11 }, color: '#6b7280' }
        },
        y: {
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 12, weight: '600' }, color: '#374151' }
        }
      }
    };
  }

  exportarPDF() {
    alert('La exportación a PDF estará disponible cuando el backend esté integrado.');
  }
}
