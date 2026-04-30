import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { AdminService } from '../../../core/services/admin.service';
import { KpiDashboard, InsercionCarrera, CompetenciaDemandada } from '../../../core/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, ChartModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit {
  kpis?: KpiDashboard;
  insercion: InsercionCarrera[]          = [];
  competencias: CompetenciaDemandada[]   = [];
  loading = true;

  barChartData: any = {};
  barChartOptions: any = {};
  radarChartData: any = {};
  radarChartOptions: any = {};

  private adminSvc = inject(AdminService);

  ngOnInit() {
    this.adminSvc.getKpis().subscribe(k => {
      this.kpis = k;
    });

    this.adminSvc.getInsercionPorCarrera().subscribe(data => {
      this.insercion = data;
      this.buildBarChart(data);
    });

    this.adminSvc.getCompetenciasDemandadas().subscribe(data => {
      this.competencias = data;
      this.buildRadarChart(data);
      this.loading = false;
    });
  }

  private buildBarChart(data: InsercionCarrera[]) {
    this.barChartData = {
      labels: data.map(d => d.abreviatura),
      datasets: [
        {
          label: 'Insertados',
          data: data.map(d => d.insertados),
          backgroundColor: 'rgba(3,131,123,0.80)',
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Sin inserción',
          data: data.map(d => d.total_egresados - d.insertados),
          backgroundColor: 'rgba(229,231,235,0.8)',
          borderRadius: 6,
          borderSkipped: false,
        }
      ]
    };
    this.barChartOptions = {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 12 }, color: '#6b7280', boxWidth: 12, padding: 16 } },
        tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw}` } }
      },
      scales: {
        x: {
          stacked: false,
          grid: { display: false },
          ticks: { font: { family: 'Inter', size: 11 }, color: '#6b7280' }
        },
        y: {
          grid: { color: '#f0f0f0' },
          ticks: { font: { family: 'Inter', size: 11 }, color: '#6b7280' }
        }
      }
    };
  }

  private buildRadarChart(data: CompetenciaDemandada[]) {
    this.radarChartData = {
      labels: data.map(d => d.label),
      datasets: [
        {
          label: 'Demanda empresarial',
          data: data.map(d => d.demanda),
          backgroundColor: 'rgba(3,131,123,0.85)',
          borderRadius: 4,
        },
        {
          label: 'Promedio egresados',
          data: data.map(d => d.promedio),
          backgroundColor: 'rgba(3,61,60,0.4)',
          borderRadius: 4,
        }
      ]
    };
    this.radarChartOptions = {
      responsive: true,
      indexAxis: 'y', // Horizontal bars for better readability of labels
      animation: { duration: 600 },
      plugins: {
        legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 12 }, color: '#6b7280', boxWidth: 12, padding: 16 } },
        tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.raw}%` } }
      },
      scales: {
        x: {
          min: 0, max: 100,
          ticks: { stepSize: 25, font: { family: 'Inter', size: 10 }, color: '#9ca3af' },
          grid: { color: '#f3f4f6' }
        },
        y: {
          ticks: { font: { family: 'Inter', size: 11, weight: '500' }, color: '#374151' },
          grid: { display: false }
        }
      }
    };
  }
}
