import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SliderModule } from 'primeng/slider';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { VacanteService } from '../../../core/services/vacante.service';
import { ScoreCircleComponent } from '../../../shared/components/score-circle/score-circle.component';
import { DimensionPillComponent } from '../../../shared/components/dimension-pill/dimension-pill.component';
import { SpiderChartComponent } from '../../../shared/components/spider-chart/spider-chart.component';
import { Egresado, DimensionType, egresadoNombreCompleto } from '../../../core/models';
import { EGRESADOS_MOCK } from '../../../shared/mocks/egresados.mock';
import { VACANTES_MOCK } from '../../../shared/mocks/vacantes.mock';

@Component({
  selector: 'app-talento',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, SliderModule, DropdownModule, DialogModule,
    ScoreCircleComponent, DimensionPillComponent, SpiderChartComponent,
  ],
  templateUrl: './talento.component.html',
  styleUrls: ['./talento.component.scss'],
})
export class TalentoComponent implements OnInit {
  egresados: Egresado[] = [];
  filtros = { psicometrica: 0, cognitiva: 0, tecnica: 0, proyectiva: 0, minCoincidencia: 80 };

  selectedEgresado?: Egresado;
  showDialog = false;

  readonly DIMS: DimensionType[] = ['psicometrica', 'cognitiva', 'tecnica', 'proyectiva'];
  private vacanteSvc = inject(VacanteService);

  get egresadosFiltrados() {
    const perfil = VACANTES_MOCK[0]?.perfil_ideal;
    return this.egresados
      .filter(eg => eg.scores && eg.evaluaciones_completadas.length === 4)
      .map(eg => ({
        egresado: eg,
        coincidencia: perfil ? this.vacanteSvc.calcularCoincidencia(eg.scores!, perfil) : 0,
      }))
      .filter(c => {
        const s = c.egresado.scores!;
        return (
          c.coincidencia >= this.filtros.minCoincidencia &&
          s.psicometrica >= this.filtros.psicometrica &&
          s.cognitiva    >= this.filtros.cognitiva    &&
          s.tecnica      >= this.filtros.tecnica      &&
          s.proyectiva   >= this.filtros.proyectiva
        );
      })
      .sort((a, b) => b.coincidencia - a.coincidencia);
  }

  ngOnInit() {
    this.egresados = EGRESADOS_MOCK;
  }

  verPerfil(eg: Egresado) {
    this.selectedEgresado = eg;
    this.showDialog       = true;
  }

  nombreCompleto(eg: Egresado) { return egresadoNombreCompleto(eg); }
}
