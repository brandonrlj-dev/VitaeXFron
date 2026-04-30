import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { AdminService } from '../../../core/services/admin.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { ProfilePhotoService } from '../../../core/services/profile-photo.service';
import { ZoneHeatmapComponent } from '../../../shared/components/zone-heatmap/zone-heatmap.component';
import { Empresa, InsercionCarrera, CompetenciaDemandada, KpiDashboard } from '../../../core/models';

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
  loading      = true;
  exportando   = false;

  private insercionApi: InsercionCarrera[] = [];
  private empresasApi: Empresa[] = [];

  pieChartData: any    = {};
  pieChartOptions: any = {};
  barChartData2: any   = {};
  barChartOptions2: any = {};
  conveniosPorZona = { norte: 0, centro: 0, sur: 0 };
  mapaCalorData: any[] = [];

  readonly today = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  filterDate: Date[] | undefined;
  filterCareer: string | null = null;
  filterZone:   string | null = null;

  careers: { label: string; value: string | null }[] = [
    { label: 'Todas las carreras', value: null },
  ];

  zones = [
    { label: 'Todas las zonas', value: null   },
    { label: 'Zona Norte',      value: 'norte'  },
    { label: 'Zona Centro',     value: 'centro' },
    { label: 'Zona Sur',        value: 'sur'    },
  ];

  private adminSvc    = inject(AdminService);
  private empresaSvc  = inject(EmpresaService);
  private photoSvc    = inject(ProfilePhotoService);
  private http        = inject(HttpClient);

  get logoAdmin(): string | null { return this.photoSvc.logoAdmin(); }

  ngOnInit() {
    this.adminSvc.getKpis().subscribe(k => this.kpis = k);
    this.empresaSvc.getEmpresas().subscribe(empresas => {
      this.empresasApi = empresas;
      this.aplicarFiltros();
    });
    this.adminSvc.getInsercionPorCarrera().subscribe(data => {
      this.insercionApi = data;
      this.careers = [
        { label: 'Todas las carreras', value: null },
        ...data.map(row => ({ label: `${row.abreviatura} - ${row.carrera}`, value: row.abreviatura })),
      ];
      this.aplicarFiltros();
    });
    this.adminSvc.getCompetenciasDemandadas().subscribe(data => {
      this.competencias = data;
      this.buildBarChart2(data);
      this.loading = false;
    });
  }

  private buildPieChart() {
    const z = this.conveniosPorZona;
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
        label: 'Nivel promedio requerido',
        data: data.map(d => d.promedio),
        backgroundColor: ['#0d9488', '#3b82f6', '#8b5cf6', '#f97316'],
        borderRadius: 8,
        borderSkipped: false,
      }]
    };
    this.barChartOptions2 = {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#033d3c',
          titleFont: { family: 'Inter', size: 12, weight: '700' },
          bodyFont: { family: 'Inter', size: 12 },
          padding: 12,
          cornerRadius: 8,
          displayColors: false
        }
      },
      scales: {
        x: {
          min: 0,
          max: 100,
          grid: { color: '#f1f5f9', drawTicks: false },
          border: { display: false },
          ticks: { font: { family: 'Inter', size: 11, weight: '500' }, color: '#64748b', padding: 10 }
        },
        y: {
          grid: { display: false },
          border: { display: false },
          ticks: { font: { family: 'Inter', size: 12, weight: '700' }, color: '#1e293b', padding: 10 }
        }
      },
      layout: { padding: { left: 0, right: 10, top: 0, bottom: 0 } }
    };
  }

  aplicarFiltros() {
    this.insercion = this.filterCareer
      ? this.insercionApi.filter(row => row.abreviatura === this.filterCareer)
      : this.insercionApi;

    const empresas = this.filterZone
      ? this.empresasApi.filter(empresa => empresa.zona === this.filterZone)
      : this.empresasApi;

    this.conveniosPorZona = empresas.reduce((acc, empresa) => {
      acc[empresa.zona] = (acc[empresa.zona] ?? 0) + 1;
      return acc;
    }, { norte: 0, centro: 0, sur: 0 });

    const totalEmpresas = empresas.length || 1;
    this.mapaCalorData = [
      {
        zona: 'norte',
        label: 'Zona Norte',
        municipios: 'Acaponeta · Santiago Ixcuintla · Tuxpan',
        empresas: this.conveniosPorZona.norte,
        porcentaje: Math.round((this.conveniosPorZona.norte / totalEmpresas) * 100)
      },
      {
        zona: 'centro',
        label: 'Zona Centro',
        municipios: 'Tepic · Xalisco · Bahía de Banderas',
        empresas: this.conveniosPorZona.centro,
        porcentaje: Math.round((this.conveniosPorZona.centro / totalEmpresas) * 100)
      },
      {
        zona: 'sur',
        label: 'Zona Sur',
        municipios: 'Compostela · San Blas',
        empresas: this.conveniosPorZona.sur,
        porcentaje: Math.round((this.conveniosPorZona.sur / totalEmpresas) * 100)
      }
    ];

    this.buildPieChart();
  }

  exportarPDF() {
    if (this.exportando) return;
    this.exportando = true;

    const url   = this.adminSvc.reporteInsercionPdfUrl();
    const token = localStorage.getItem('token') ?? sessionStorage.getItem('token') ?? '';
    const headers = new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});

    this.http.get(url, { headers, responseType: 'blob' }).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `reporte-insercion-${new Date().toISOString().slice(0, 10)}.pdf`;
        a.click();
        URL.revokeObjectURL(objectUrl);
        this.exportando = false;
      },
      error: (err) => {
        this.exportando = false;
        console.error('Error al exportar PDF:', err);
        alert('No se pudo generar el reporte PDF. Por favor, revisa la consola o intenta de nuevo.');
      },
    });
  }
}
