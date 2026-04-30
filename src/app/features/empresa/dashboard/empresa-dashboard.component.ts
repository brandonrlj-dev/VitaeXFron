import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { EmpresaService } from '../../../core/services/empresa.service';
import { VacanteService } from '../../../core/services/vacante.service';
import { EgresadoService } from '../../../core/services/egresado.service';
import { ScoreCircleComponent } from '../../../shared/components/score-circle/score-circle.component';
import { SpiderChartComponent } from '../../../shared/components/spider-chart/spider-chart.component';
import { DimensionPillComponent } from '../../../shared/components/dimension-pill/dimension-pill.component';
import { Empresa, Vacante, Egresado, DimensionType, egresadoNombreCompleto } from '../../../core/models';
import { EGRESADOS_MOCK } from '../../../shared/mocks/egresados.mock';

interface CandidatoCard {
  egresado: Egresado;
  coincidencia: number;
}

@Component({
  selector: 'app-empresa-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ButtonModule, DialogModule, FormsModule,
    ScoreCircleComponent, SpiderChartComponent, DimensionPillComponent,
  ],
  templateUrl: './empresa-dashboard.component.html',
  styleUrls: ['./empresa-dashboard.component.scss'],
})
export class EmpresaDashboardComponent implements OnInit {
  empresa?: Empresa;
  vacantes: Vacante[]          = [];
  candidatos: CandidatoCard[]  = [];
  loading = true;

  selectedCandidato?: CandidatoCard;
  showPerfilDialog = false;

  readonly DIMS: DimensionType[] = ['psicometrica', 'cognitiva', 'tecnica', 'proyectiva'];

  private empresaSvc  = inject(EmpresaService);
  private vacanteSvc  = inject(VacanteService);

  get vacantesActivas()   { return this.vacantes.filter(v => v.activa).length; }
  get totalCandidatos()   { return this.candidatos.length; }

  get nombreEmpresa() { return this.empresa?.nombre ?? ''; }

  ngOnInit() {
    this.empresaSvc.getEmpresaActual().subscribe(e => {
      this.empresa = e;
      this.empresaSvc.getVacantesEmpresa(e.id).subscribe(vacs => {
        this.vacantes = vacs;
        this.buildCandidatos();
        this.loading = false;
      });
    });
  }

  private buildCandidatos() {
    const primeraVacante = this.vacantes[0];
    if (!primeraVacante) return;

    this.candidatos = EGRESADOS_MOCK
      .filter(eg => eg.scores && eg.evaluaciones_completadas.length === 4)
      .map(eg => ({
        egresado: eg,
        coincidencia: this.vacanteSvc.calcularCoincidencia(eg.scores!, primeraVacante.perfil_ideal),
      }))
      .filter(c => c.coincidencia >= 60)
      .sort((a, b) => b.coincidencia - a.coincidencia);
  }

  verPerfilCompleto(candidato: CandidatoCard) {
    this.selectedCandidato = candidato;
    this.showPerfilDialog  = true;
  }

  nombreCompleto(eg: Egresado): string { return egresadoNombreCompleto(eg); }
}
