import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { VacanteService } from '../../../core/services/vacante.service';
import { EgresadoService } from '../../../core/services/egresado.service';
import { ScoreCircleComponent } from '../../../shared/components/score-circle/score-circle.component';
import { SpiderChartComponent } from '../../../shared/components/spider-chart/spider-chart.component';
import { DimensionPillComponent } from '../../../shared/components/dimension-pill/dimension-pill.component';
import { Vacante, Egresado, DimensionType, DIMENSION_CONFIG } from '../../../core/models';

@Component({
  selector: 'app-vacante-detalle',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ButtonModule, ProgressBarModule, ToastModule,
    ScoreCircleComponent, SpiderChartComponent, DimensionPillComponent,
  ],
  providers: [MessageService],
  templateUrl: './vacante-detalle.component.html',
  styleUrls: ['./vacante-detalle.component.scss'],
})
export class VacanteDetalleComponent implements OnInit {
  vacante?: Vacante;
  egresado?: Egresado;
  loading    = true;
  postulando = false;
  yaPostulado = false;

  readonly DIMS: DimensionType[] = ['psicometrica', 'cognitiva', 'tecnica', 'proyectiva'];
  readonly DIMENSION_CONFIG = DIMENSION_CONFIG;

  private route        = inject(ActivatedRoute);
  private vacanteSvc   = inject(VacanteService);
  private egresadoSvc  = inject(EgresadoService);
  private msgSvc       = inject(MessageService);

  get coincidencia(): number {
    return this.vacante?.coincidencia ?? 0;
  }

  get fortalezas(): DimensionType[] {
    if (!this.egresado?.scores || !this.vacante) return [];
    return this.DIMS.filter(d =>
      this.egresado!.scores![d] >= this.vacante!.perfil_ideal[d]
    );
  }

  get brechas(): DimensionType[] {
    if (!this.egresado?.scores || !this.vacante) return [];
    return this.DIMS.filter(d =>
      this.egresado!.scores![d] < this.vacante!.perfil_ideal[d]
    );
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    forkJoin({
      egresado: this.egresadoSvc.getEgresadoActual(),
      vacante: this.vacanteSvc.getVacanteById(id),
    }).pipe(
      switchMap(({ egresado, vacante }) => this.vacanteSvc.getMatchingEgresado(egresado.id).pipe(
        map(matching => ({
          egresado,
          vacante: vacante ? { ...vacante, coincidencia: matching[vacante.id] ?? 0 } : vacante,
        }))
      ))
    ).subscribe({
      next: ({ egresado, vacante }) => {
        this.egresado = egresado;
        this.vacante = vacante;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  postularme() {
    if (!this.egresado || !this.vacante) return;
    this.postulando = true;
    this.vacanteSvc.postularme(this.egresado.id, this.vacante.id).subscribe({
      next: () => {
        this.postulando = false;
        this.yaPostulado = true;
        this.msgSvc.add({ severity: 'success', summary: '¡Postulación enviada!', detail: `Tu solicitud para "${this.vacante!.puesto}" fue enviada exitosamente.` });
      },
      error: () => {
        this.postulando = false;
        this.msgSvc.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar la postulación. Intenta más tarde.' });
      }
    });
  }

  scoreColor(score: number, ideal: number): string {
    const pct = score / ideal;
    if (pct >= 1) return '#03837b';
    if (pct >= 0.8) return '#3b82f6';
    return '#f97316';
  }

  exportarReporte() {}
}
