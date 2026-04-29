import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
import { EgresadoService } from '../../../core/services/egresado.service';
import { ScoreCircleComponent } from '../../../shared/components/score-circle/score-circle.component';
import { SpiderChartComponent } from '../../../shared/components/spider-chart/spider-chart.component';
import { DimensionPillComponent } from '../../../shared/components/dimension-pill/dimension-pill.component';
import { Egresado, DimensionType, DIMENSION_CONFIG, egresadoNombreCompleto } from '../../../core/models';

interface EvalCard {
  dimension: DimensionType;
  label:      string;
  icon:       string;
  color:      string;
  completada: boolean;
  puntaje?:   number;
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
  loading = true;
  evalCards: EvalCard[] = [];

  readonly DIMS: DimensionType[] = ['psicometrica', 'cognitiva', 'tecnica', 'proyectiva'];

  private svc = inject(EgresadoService);

  get nombreCompleto() { return this.egresado ? egresadoNombreCompleto(this.egresado) : ''; }

  get completitud(): number {
    if (!this.egresado) return 0;
    let pts = 0;
    if (this.egresado.datos_confirmados) pts += 20;
    pts += (this.egresado.evaluaciones_completadas.length / 4) * 60;
    if (this.egresado.cv_url) pts += 20;
    return Math.round(pts);
  }

  get puedePostular(): boolean {
    return !!this.egresado && this.egresado.evaluaciones_completadas.length === 4;
  }

  get pendientes(): number {
    return 4 - (this.egresado?.evaluaciones_completadas.length ?? 0);
  }

  get scoreTotal(): number {
    const s = this.egresado?.scores;
    if (!s) return 0;
    return Math.round((s.psicometrica + s.cognitiva + s.tecnica + s.proyectiva) / 4);
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
