import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { AdminService } from '../../../core/services/admin.service';
import { ProfilePhotoService } from '../../../core/services/profile-photo.service';
import { ZoneHeatmapComponent } from '../../../shared/components/zone-heatmap/zone-heatmap.component';
import { InsercionCarrera, CompetenciaDemandada, KpiDashboard } from '../../../core/models';
import { CONVENIOS_POR_ZONA_MOCK } from '../../../shared/mocks/reportes.mock';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, ChartModule, CalendarModule, DropdownModule,
    ZoneHeatmapComponent,
  ],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.scss'],
})
export class ReportesComponent implements OnInit {
  kpis?: KpiDashboard;
  insercion: InsercionCarrera[]        = [];
  competencias: CompetenciaDemandada[] = [];
  loading = true;

  pieChartData: any    = {};
  pieChartOptions: any = {};
  barChartData2: any   = {};
  barChartOptions2: any = {};

  readonly today = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  filterDate: Date[] | undefined;
  filterCareer: string | null = null;
  filterZone:   string | null = null;

  careers = [
    { label: 'Todas las carreras', value: null },
    { label: 'ITI — Tecnologías de la Información', value: 'ITI' },
    { label: 'IMI — Mantenimiento Industrial',       value: 'IMI' },
    { label: 'IGE — Gestión Empresarial',            value: 'IGE' },
    { label: 'ILT — Logística y Transporte',         value: 'ILT' },
    { label: 'TM  — Mecatrónica',                    value: 'TM'  },
    { label: 'IA  — Agronegocios',                   value: 'IA'  },
  ];

  zones = [
    { label: 'Todas las zonas', value: null   },
    { label: 'Zona Norte',      value: 'norte'  },
    { label: 'Zona Centro',     value: 'centro' },
    { label: 'Zona Sur',        value: 'sur'    },
  ];

  private adminSvc    = inject(AdminService);
  private photoSvc    = inject(ProfilePhotoService);

  get logoAdmin(): string | null { return this.photoSvc.logoAdmin(); }

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
      datasets: [{
        label: 'Demanda empresarial',
        data: data.map(d => d.demanda),
        backgroundColor: ['#0d9488', '#3b82f6', '#8b5cf6', '#f97316'],
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
    this.barChartOptions2 = {
      indexAxis: 'y',
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { min: 0, max: 100, grid: { color: '#f0f0f0' }, ticks: { font: { family: 'Inter', size: 11 }, color: '#6b7280' } },
        y: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 12, weight: '600' }, color: '#374151' } }
      }
    };
  }

  aplicarFiltros() {
    this.loading = true;
    setTimeout(() => { this.loading = false; }, 500);
  }

  exportarPDF() {
    window.print();
  }
}
