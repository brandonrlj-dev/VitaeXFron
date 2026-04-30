import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FormsModule } from '@angular/forms';
import { DimensionType, DIMENSION_CONFIG, Pregunta, Egresado } from '../../../core/models';
import { EgresadoService } from '../../../core/services/egresado.service';

@Component({
  selector: 'app-evaluaciones',
  standalone: true,
  imports: [CommonModule, ButtonModule, ProgressBarModule, RadioButtonModule, FormsModule],
  templateUrl: './evaluaciones.component.html',
  styleUrls: ['./evaluaciones.component.scss'],
})
export class EvaluacionesComponent implements OnInit {
  dimension?: DimensionType;
  preguntas: Pregunta[]     = [];
  currentIndex              = 0;
  respuestas: Record<string, string> = {};
  respuestaActual           = '';
  fase: 'seleccion' | 'prueba' | 'resultado' = 'seleccion';
  puntajeObtenido           = 0;
  saving                    = false;
  egresado?: Egresado;

  readonly DIMS: DimensionType[] = ['psicometrica', 'cognitiva', 'tecnica', 'proyectiva'];
  readonly DIMENSION_CONFIG      = DIMENSION_CONFIG;

  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private egresadoSvc = inject(EgresadoService);

  get preguntaActual(): Pregunta | undefined { return this.preguntas[this.currentIndex]; }
  get progreso(): number { return this.preguntas.length ? ((this.currentIndex + 1) / this.preguntas.length) * 100 : 0; }
  get config() { return this.dimension ? DIMENSION_CONFIG[this.dimension] : null; }

  ngOnInit() {
    this.egresadoSvc.getEgresadoActual().subscribe(e => {
      this.egresado = e;
      const dim = this.route.snapshot.queryParamMap.get('dimension') as DimensionType | null;
      if (dim && !this.isCompletada(dim)) {
        this.iniciarDimension(dim);
      }
    });
  }

  isCompletada(dim: DimensionType): boolean {
    return !!this.egresado?.evaluaciones_completadas.includes(dim);
  }

  getPuntaje(dim: DimensionType): number | undefined {
    return this.egresado?.scores?.[dim];
  }

  iniciarDimension(dim: DimensionType) {
    if (this.isCompletada(dim) || !this.egresado) return;
    this.egresadoSvc.getPreguntasPorDimension(dim, this.egresado.id).subscribe({
      next: preguntas => {
        if (!preguntas.length) {
          alert('No hay preguntas registradas para esta dimension.');
          return;
        }
        this.dimension     = dim;
        this.preguntas     = preguntas;
        this.currentIndex  = 0;
        this.respuestas    = {};
        this.respuestaActual = '';
        this.fase          = 'prueba';
      },
      error: () => {
        alert('No se pudieron cargar las preguntas desde el backend.');
      }
    });
  }

  seleccionarRespuesta(opcionId: string) {
    this.respuestaActual = opcionId;
  }

  siguiente() {
    if (!this.respuestaActual) return;
    this.respuestas[this.preguntaActual!.id] = this.respuestaActual;
    this.respuestaActual = '';

    if (this.currentIndex < this.preguntas.length - 1) {
      this.currentIndex++;
    } else {
      this.finalizarEvaluacion();
    }
  }

  anterior() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.respuestaActual = this.respuestas[this.preguntaActual!.id] ?? '';
    }
  }

  private finalizarEvaluacion() {
    if (!this.egresado || !this.dimension) return;

    this.saving = true;
    this.egresadoSvc.guardarResultadoEvaluacion(this.egresado.id, this.dimension, this.preguntas, this.respuestas)
      .subscribe({
        next: resultado => {
          this.puntajeObtenido = resultado.puntaje_obtenido;
          this.fase = 'resultado';
          this.saving = false;
          this.egresadoSvc.invalidarCache();
        },
        error: error => {
          this.saving = false;
          alert(error.message ?? 'No se pudo finalizar la evaluacion.');
        }
      });
  }

  irAlDashboard() { this.router.navigate(['/egresado/dashboard']); }
  otraDimension()  { this.fase = 'seleccion'; this.dimension = undefined; }

  cancelarPrueba() {
    if (confirm('¿Estás seguro de que quieres salir de la evaluación? Perderás tu progreso actual.')) {
      this.otraDimension();
    }
  }

  resetPruebas() {
    if (!this.egresado) return;
    this.egresadoSvc.resetEvaluaciones(this.egresado.id).subscribe(() => {
      // Actualizamos localmente para no recargar la pagina y perder el estado actual.
      this.egresado!.evaluaciones_completadas = [];
      this.egresado!.scores = { psicometrica: 0, cognitiva: 0, tecnica: 0, proyectiva: 0 };
    });
  }
}
