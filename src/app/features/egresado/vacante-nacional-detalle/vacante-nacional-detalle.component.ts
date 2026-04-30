import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { VacanteService } from '../../../core/services/vacante.service';
import { EgresadoService } from '../../../core/services/egresado.service';
import { ScoreCircleComponent } from '../../../shared/components/score-circle/score-circle.component';
import { SpiderChartComponent } from '../../../shared/components/spider-chart/spider-chart.component';
import { DimensionPillComponent } from '../../../shared/components/dimension-pill/dimension-pill.component';
import { VacanteNacional, Egresado, DimensionType, DIMENSION_CONFIG, DimensionScores } from '../../../core/models';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-vacante-nacional-detalle',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    ButtonModule, ProgressBarModule, ToastModule,
    ScoreCircleComponent, SpiderChartComponent, DimensionPillComponent,
  ],
  providers: [MessageService],
  templateUrl: './vacante-nacional-detalle.component.html',
  styleUrls: ['./vacante-nacional-detalle.component.scss'],
})
export class VacanteNacionalDetalleComponent implements OnInit {
  vacante?: VacanteNacional;
  egresado?: Egresado;
  perfilIdeal?: DimensionScores;
  loading      = true;
  postulado    = false;
  exportingPdf = false;

  readonly DIMS: DimensionType[] = ['psicometrica', 'cognitiva', 'tecnica', 'proyectiva'];
  readonly DIMENSION_CONFIG = DIMENSION_CONFIG;

  private route       = inject(ActivatedRoute);
  private vacanteSvc  = inject(VacanteService);
  private egresadoSvc = inject(EgresadoService);
  private msgSvc      = inject(MessageService);
  private http        = inject(HttpClient);

  get coincidencia(): number {
    if (!this.egresado?.scores || !this.perfilIdeal) return 0;
    return this.vacanteSvc.calcularCoincidencia(this.egresado.scores, this.perfilIdeal);
  }

  get fortalezas(): DimensionType[] {
    if (!this.egresado?.scores || !this.perfilIdeal) return [];
    return this.DIMS.filter(d => this.egresado!.scores![d] >= this.perfilIdeal![d]);
  }

  get brechas(): DimensionType[] {
    if (!this.egresado?.scores || !this.perfilIdeal) return [];
    return this.DIMS.filter(d => this.egresado!.scores![d] < this.perfilIdeal![d]);
  }

  get evaluacionesCompletas(): boolean {
    return this.DIMS.every(dim => this.egresado?.evaluaciones_completadas.includes(dim));
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.egresadoSvc.getEgresadoActual().subscribe(e => {
      this.egresado = e;
      if (!this.evaluacionesCompletas) {
        this.loading = false;
        return;
      }
      if (id) {
        this.vacanteSvc.getVacanteNacionalById(id).subscribe(vn => {
          this.vacante     = vn;
          this.perfilIdeal = this.inferirPerfilIdeal(vn?.puesto ?? '', vn?.descripcion ?? '');
          this.loading     = false;
        });
      }
    });
  }

  postular(): void {
    if (!this.vacante) return;
    const url = this.vacante.url_externa;
    if (!url || url === '#') {
      this.msgSvc.add({ severity: 'warn', summary: 'Sin enlace externo', detail: 'Esta vacante no tiene URL de postulación disponible.' });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    this.postulado = true;
    this.msgSvc.add({
      severity: 'success',
      summary: 'Postulación registrada',
      detail: 'Se abrió el portal externo. La universidad dará seguimiento a tu interés.',
    });
  }

  exportarReporte(): void {
    if (!this.egresado || this.exportingPdf) return;
    this.exportingPdf = true;
    this.http.get(`${environment.apiUrl}/reportes/egresado/${this.egresado.id}/pdf`, { responseType: 'blob' }).subscribe({
      next: blob => {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href  = url;
        link.download = `reporte_idoneidad_${this.egresado!.matricula || this.egresado!.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.exportingPdf = false;
      },
      error: () => {
        this.exportingPdf = false;
        this.msgSvc.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el reporte PDF.' });
      }
    });
  }

  scoreColor(score: number, ideal: number): string {
    const r = score / Math.max(ideal, 1);
    if (r >= 1)   return '#03837b';
    if (r >= 0.8) return '#3b82f6';
    return '#f97316';
  }

  /**
   * Infiere el perfil ideal de competencias (0–100 por dimensión)
   * a partir del título y descripción de la vacante.
   */
  private inferirPerfilIdeal(puesto: string, descripcion: string): DimensionScores {
    const texto = (puesto + ' ' + descripcion).toLowerCase();

    // Defaults base: perfil generalista equilibrado
    let psi = 65, cog = 65, tec = 65, pro = 65;

    if (/developer|programador|software|frontend|backend|devops|qa|full.?stack|php|python|javascript|react|angular|nodejs|java |\.net|sistemas|computo|redes|infraestructura|soporte.?t[eé]cnico/.test(texto)) {
      tec = 88; cog = 82; psi = 58; pro = 65;
    } else if (/dato[s]?|data |analytics|analista|machine.?learning|bi |inteligencia.?artificial|estadis/.test(texto)) {
      cog = 90; tec = 82; psi = 60; pro = 70;
    } else if (/industrial|manufactura|calidad|producci[oó]n|mantenimiento|mecatr[oó]n|plc|automatizaci[oó]n|proceso/.test(texto)) {
      tec = 82; cog = 75; psi = 62; pro = 65;
    } else if (/contador|contabilidad|finanzas|auditor|impuesto|n[oó]mina|financiero|tesor/.test(texto)) {
      cog = 85; tec = 75; psi = 65; pro = 65;
    } else if (/log[ií]stica|almac[eé]n|inventario|cadena|transporte|distribuci[oó]n|operador/.test(texto)) {
      tec = 72; cog = 70; psi = 65; pro = 65;
    } else if (/recursos.?humanos|rrhh|reclutador|talento|capital.?humano|selecci[oó]n|orientador/.test(texto)) {
      psi = 88; pro = 78; cog = 68; tec = 55;
    } else if (/ventas|vendedor|comercial|asesor.?comercial|ejecutivo.?ventas/.test(texto)) {
      psi = 85; pro = 82; cog = 65; tec = 55;
    } else if (/marketing|publicidad|community|branding|redes.?sociales|seo|sem/.test(texto)) {
      pro = 82; psi = 78; cog = 68; tec = 60;
    } else if (/administrador|administrativo|coordinador|gerente|director/.test(texto)) {
      pro = 80; psi = 75; cog = 72; tec = 58;
    } else if (/enfermera|enfermero|salud|m[eé]dico|cl[ií]nica|hospital/.test(texto)) {
      psi = 80; cog = 75; tec = 72; pro = 65;
    } else if (/chef|cocinero|gastronom|alimentos|bebidas|rest aurante/.test(texto)) {
      tec = 78; psi = 72; cog = 65; pro = 68;
    } else if (/arquitecto|arquitectura|dise[ñn]o|revit|autocad|bim/.test(texto)) {
      tec = 80; cog = 75; pro = 72; psi = 60;
    } else if (/docente|maestro|profesor|educaci[oó]n|capacitaci[oó]n/.test(texto)) {
      psi = 82; cog = 78; pro = 72; tec = 60;
    }

    return { psicometrica: psi, cognitiva: cog, tecnica: tec, proyectiva: pro };
  }
}
