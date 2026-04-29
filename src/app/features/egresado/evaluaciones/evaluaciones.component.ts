import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { RadioButtonModule } from 'primeng/radiobutton';
import { FormsModule } from '@angular/forms';
import { DimensionType, DIMENSION_CONFIG, Pregunta } from '../../../core/models';
import { BANCO_PREGUNTAS } from '../../../shared/mocks/evaluaciones.mock';
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

  readonly DIMS: DimensionType[] = ['psicometrica', 'cognitiva', 'tecnica', 'proyectiva'];
  readonly DIMENSION_CONFIG      = DIMENSION_CONFIG;

  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private egresadoSvc = inject(EgresadoService);

  get preguntaActual(): Pregunta | undefined { return this.preguntas[this.currentIndex]; }
  get progreso(): number { return ((this.currentIndex + 1) / this.preguntas.length) * 100; }
  get config() { return this.dimension ? DIMENSION_CONFIG[this.dimension] : null; }

  ngOnInit() {
    const dim = this.route.snapshot.queryParamMap.get('dimension') as DimensionType | null;
    if (dim && BANCO_PREGUNTAS[dim]) {
      this.iniciarDimension(dim);
    }
  }

  iniciarDimension(dim: DimensionType) {
    this.dimension     = dim;
    this.preguntas     = BANCO_PREGUNTAS[dim];
    this.currentIndex  = 0;
    this.respuestas    = {};
    this.respuestaActual = '';
    this.fase          = 'prueba';
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
      this.calcularResultado();
    }
  }

  anterior() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.respuestaActual = this.respuestas[this.preguntaActual!.id] ?? '';
    }
  }

  private calcularResultado() {
    const total = this.preguntas.reduce((sum, p) => {
      const respId  = this.respuestas[p.id];
      const opcion  = p.opciones.find(o => o.id === respId);
      return sum + (opcion?.valor ?? 0);
    }, 0);

    const maxPts  = this.preguntas.length * 4;
    this.puntajeObtenido = Math.round((total / maxPts) * 100);
    this.fase     = 'resultado';
    this.saving   = true;

    this.egresadoSvc.guardarResultadoEvaluacion('1', this.dimension!, this.puntajeObtenido)
      .subscribe(() => { this.saving = false; });
  }

  irAlDashboard() { this.router.navigate(['/egresado/dashboard']); }
  otraDimension()  { this.fase = 'seleccion'; this.dimension = undefined; }
}
