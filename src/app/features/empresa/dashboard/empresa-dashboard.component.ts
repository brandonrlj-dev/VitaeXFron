import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';
import { EmpresaService } from '../../../core/services/empresa.service';
import { VacanteService } from '../../../core/services/vacante.service';
import { ScoreCircleComponent } from '../../../shared/components/score-circle/score-circle.component';
import { SpiderChartComponent } from '../../../shared/components/spider-chart/spider-chart.component';
import { DimensionPillComponent } from '../../../shared/components/dimension-pill/dimension-pill.component';
import { Empresa, Vacante, Egresado, Postulacion, DimensionType, egresadoNombreCompleto } from '../../../core/models';
import { EGRESADOS_MOCK, POSTULACIONES_MOCK } from '../../../shared/mocks/egresados.mock';

interface CandidatoCard {
  egresado: Egresado;
  coincidencia: number;
}

@Component({
  selector: 'app-empresa-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ButtonModule, DialogModule, DropdownModule, FormsModule,
    ScoreCircleComponent, SpiderChartComponent, DimensionPillComponent,
  ],
  templateUrl: './empresa-dashboard.component.html',
  styleUrls: ['./empresa-dashboard.component.scss'],
})
export class EmpresaDashboardComponent implements OnInit {
  empresa?: Empresa;
  vacantes: Vacante[]          = [];
  postulaciones: Postulacion[] = POSTULACIONES_MOCK;
  selectedVacanteId = '';
  loading = true;

  selectedCandidato?: CandidatoCard;
  showPerfilDialog = false;

  readonly DIMS: DimensionType[] = ['psicometrica', 'cognitiva', 'tecnica', 'proyectiva'];

  private empresaSvc  = inject(EmpresaService);
  private vacanteSvc  = inject(VacanteService);

  get vacantesActivas()   { return this.vacantes.filter(v => v.activa).length; }
  get totalCandidatos()   { return this.candidatosIdoneos.length; }

  get nombreEmpresa() { return this.empresa?.nombre ?? ''; }

  get vacanteOpciones() {
    return this.vacantes.map(v => ({ label: v.puesto, value: v.id }));
  }

  get vacanteSeleccionada(): Vacante | undefined {
    return this.vacantes.find(v => v.id === this.selectedVacanteId) ?? this.vacantes[0];
  }

  get candidatosIdoneos(): CandidatoCard[] {
    const vacante = this.vacanteSeleccionada;
    if (!vacante) return [];

    return EGRESADOS_MOCK
      .filter(eg => eg.scores && eg.evaluaciones_completadas.length === 4)
      .map(eg => ({
        egresado: eg,
        coincidencia: this.vacanteSvc.calcularCoincidencia(eg.scores!, vacante.perfil_ideal),
      }))
      .filter(c => c.coincidencia >= 80)
      .sort((a, b) => b.coincidencia - a.coincidencia);
  }

  get postulacionesEmpresa(): Postulacion[] {
    const idsVacantes = new Set(this.vacantes.map(v => v.id));
    return this.postulaciones.filter(p => idsVacantes.has(p.vacante_id));
  }

  get postulacionesVacante(): Postulacion[] {
    const id = this.vacanteSeleccionada?.id;
    if (!id) return [];
    return this.postulacionesEmpresa.filter(p => p.vacante_id === id);
  }

  get analiticaVacante() {
    const postulaciones = this.postulacionesVacante;
    const promedio = postulaciones.length
      ? Math.round(postulaciones.reduce((sum, p) => sum + p.coincidencia, 0) / postulaciones.length)
      : 0;

    return {
      total: postulaciones.length,
      revision: postulaciones.filter(p => p.estatus === 'en_revision').length,
      entrevistas: postulaciones.filter(p => p.estatus === 'entrevista').length,
      contratados: postulaciones.filter(p => p.estatus === 'aceptada').length,
      promedio,
    };
  }

  get analiticaPorVacante() {
    return this.vacantes.map(vacante => {
      const postulaciones = this.postulacionesEmpresa.filter(p => p.vacante_id === vacante.id);
      const promedio = postulaciones.length
        ? Math.round(postulaciones.reduce((sum, p) => sum + p.coincidencia, 0) / postulaciones.length)
        : 0;

      return {
        vacante,
        total: postulaciones.length,
        revision: postulaciones.filter(p => p.estatus === 'en_revision').length,
        entrevistas: postulaciones.filter(p => p.estatus === 'entrevista').length,
        aceptadas: postulaciones.filter(p => p.estatus === 'aceptada').length,
        promedio,
      };
    });
  }

  get egresadosLaborando() {
    return this.postulacionesEmpresa
      .filter(p => p.estatus === 'aceptada')
      .map(p => ({
        postulacion: p,
        egresado: EGRESADOS_MOCK.find(eg => eg.id === p.egresado_id),
      }))
      .filter((r): r is { postulacion: Postulacion; egresado: Egresado } => !!r.egresado);
  }

  ngOnInit() {
    this.empresaSvc.getEmpresaActual().subscribe(e => {
      this.empresa = e;
      this.empresaSvc.getVacantesEmpresa(e.id).subscribe(vacs => {
        this.vacantes = vacs;
        this.selectedVacanteId = vacs.find(v => v.activa)?.id ?? vacs[0]?.id ?? '';
        this.loading = false;
      });
    });
  }

  verPerfilCompleto(candidato: CandidatoCard) {
    this.selectedCandidato = candidato;
    this.showPerfilDialog  = true;
  }

  nombreCompleto(eg: Egresado): string { return egresadoNombreCompleto(eg); }
}
