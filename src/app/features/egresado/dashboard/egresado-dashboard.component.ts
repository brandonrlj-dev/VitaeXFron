import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { EgresadoService } from '../../../core/services/egresado.service';
import { ProfilePhotoService } from '../../../core/services/profile-photo.service';
import { ScoreCircleComponent } from '../../../shared/components/score-circle/score-circle.component';
import { SpiderChartComponent } from '../../../shared/components/spider-chart/spider-chart.component';
import { DimensionPillComponent } from '../../../shared/components/dimension-pill/dimension-pill.component';
import { Egresado, DimensionType, DIMENSION_CONFIG, egresadoNombreCompleto } from '../../../core/models';

interface EvalCard {
  dimension:   DimensionType;
  label:       string;
  icon:        string;
  color:       string;
  completada:  boolean;
  puntaje?:    number;
  descripcion: string;
}

@Component({
  selector: 'app-egresado-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ButtonModule,
    ProgressBarModule, TooltipModule,
    ScoreCircleComponent, SpiderChartComponent, DimensionPillComponent,
  ],
  templateUrl: './egresado-dashboard.component.html',
  styleUrls: ['./egresado-dashboard.component.scss'],
})
export class EgresadoDashboardComponent implements OnInit {
  egresado?: Egresado;
  loading    = true;
  evalCards: EvalCard[] = [];

  readonly DIMS: DimensionType[] = ['psicometrica', 'cognitiva', 'tecnica', 'proyectiva'];

  private svc          = inject(EgresadoService);
  private photoService = inject(ProfilePhotoService);

  get nombreCompleto() { return this.egresado ? egresadoNombreCompleto(this.egresado) : ''; }
  get fotoUrl(): string | null { return this.photoService.fotoEgresado(); }
  get tieneFoto(): boolean     { return !!this.photoService.fotoEgresado(); }

  // 10% datos + 15% foto + 40% evaluaciones + 15% CV + 20% Certificado = 100%
  get completitud(): number {
    if (!this.egresado) return 0;
    let pts = 0;
    if (this.egresado.datos_confirmados) pts += 10;
    if (this.tieneFoto)                  pts += 15;
    pts += (this.egresado.evaluaciones_completadas.length / 4) * 40;
    if (this.egresado.cv_url)            pts += 15;
    if (this.egresado.certificados.length > 0) pts += 20;
    return Math.round(pts);
  }

  get puedePostular(): boolean {
    return !!this.egresado
      && this.egresado.evaluaciones_completadas.length === 4
      && this.tieneFoto;
  }

  get tooltipVacantes(): string {
    if (!this.egresado) return '';
    const falta: string[] = [];
    if (!this.tieneFoto) falta.push('foto de perfil');
    if (this.egresado.evaluaciones_completadas.length < 4)
      falta.push(`${4 - this.egresado.evaluaciones_completadas.length} evaluación(es)`);
    return falta.length ? `Falta: ${falta.join(' y ')}` : '';
  }

  get pendientes(): number {
    return 4 - (this.egresado?.evaluaciones_completadas.length ?? 0);
  }

  get scoreTotal(): number {
    const s = this.egresado?.scores;
    if (!s) return 0;
    // Puntaje global = Psicométrica(0.25) + Cognitiva(0.25) + Técnica(0.30) + Proyectiva(0.20)
    const global = (s.psicometrica * 0.25) + (s.cognitiva * 0.25) + (s.tecnica * 0.30) + (s.proyectiva * 0.20);
    return Math.round(global);
  }

  get interpretacion(): string {
    const s = this.scoreTotal;
    if (s >= 90) return 'Muy superior';
    if (s >= 75) return 'Superior';
    if (s >= 50) return 'Promedio';
    if (s >= 25) return 'Bajo';
    return 'Muy bajo';
  }

  get interpretacionColor(): string {
    const s = this.scoreTotal;
    if (s >= 75) return '#0d9488'; // Teal
    if (s >= 50) return '#3b82f6'; // Blue
    if (s >= 25) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  }

  ngOnInit() {
    this.svc.getEgresadoActual().subscribe(e => {
      this.egresado = e;
      this.loading  = false;
      this.buildEvalCards();
    });
  }

  private buildEvalCards() {
    if (!this.egresado) return;
    this.evalCards = this.DIMS.map(dim => ({
      dimension:   dim,
      label:       DIMENSION_CONFIG[dim].label,
      icon:        DIMENSION_CONFIG[dim].icon,
      color:       DIMENSION_CONFIG[dim].color,
      descripcion: DIMENSION_CONFIG[dim].description,
      completada:  this.egresado!.evaluaciones_completadas.includes(dim),
      puntaje:     this.egresado!.scores?.[dim],
    }));
  }
}
