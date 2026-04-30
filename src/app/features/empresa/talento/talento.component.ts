import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SliderModule } from 'primeng/slider';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { VacanteService } from '../../../core/services/vacante.service';
import { EmpresaService } from '../../../core/services/empresa.service';
import { ScoreCircleComponent } from '../../../shared/components/score-circle/score-circle.component';
import { DimensionPillComponent } from '../../../shared/components/dimension-pill/dimension-pill.component';
import { SpiderChartComponent } from '../../../shared/components/spider-chart/spider-chart.component';
import { Egresado, Vacante, DimensionType, egresadoNombreCompleto } from '../../../core/models';
import { EGRESADOS_MOCK } from '../../../shared/mocks/egresados.mock';

@Component({
  selector: 'app-talento',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, SliderModule, DropdownModule, DialogModule, InputTextModule, ToastModule,
    ScoreCircleComponent, DimensionPillComponent, SpiderChartComponent,
  ],
  providers: [MessageService],
  templateUrl: './talento.component.html',
  styleUrls: ['./talento.component.scss'],
})
export class TalentoComponent implements OnInit {
  egresados: Egresado[] = [];
  vacantes: Vacante[] = [];
  selectedVacanteId = '';
  filtros = { psicometrica: 0, cognitiva: 0, tecnica: 0, proyectiva: 0, minCoincidencia: 80 };

  selectedEgresado?: Egresado;
  selectedContacto?: Egresado;
  showDialog = false;
  showContactoDialog = false;
  mensajeContacto = '';

  readonly DIMS: DimensionType[] = ['psicometrica', 'cognitiva', 'tecnica', 'proyectiva'];
  private vacanteSvc = inject(VacanteService);
  private empresaSvc = inject(EmpresaService);
  private msgSvc = inject(MessageService);

  get vacanteOpciones() {
    return this.vacantes.map(v => ({ label: v.puesto, value: v.id }));
  }

  get vacanteSeleccionada() {
    return this.vacantes.find(v => v.id === this.selectedVacanteId) ?? this.vacantes[0];
  }

  get egresadosFiltrados() {
    const perfil = this.vacanteSeleccionada?.perfil_ideal;
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
    this.empresaSvc.getEmpresaActual().subscribe(empresa => {
      this.empresaSvc.getVacantesEmpresa(empresa.id).subscribe(vacantes => {
        this.vacantes = vacantes.filter(v => v.activa);
        this.selectedVacanteId = this.vacantes[0]?.id ?? '';
      });
    });
  }

  verPerfil(eg: Egresado) {
    this.selectedEgresado = eg;
    this.showDialog       = true;
  }

  contactar(eg: Egresado) {
    this.selectedContacto = eg;
    this.mensajeContacto = `Hola ${eg.nombre}, tu perfil coincide con la vacante ${this.vacanteSeleccionada?.puesto ?? 'publicada'} y nos gustaría iniciar contacto contigo.`;
    this.showContactoDialog = true;
  }

  enviarContacto() {
    if (!this.selectedContacto || !this.mensajeContacto.trim()) return;
    this.msgSvc.add({
      severity: 'success',
      summary: 'Mensaje enviado',
      detail: `Se contactó a ${this.nombreCompleto(this.selectedContacto)}.`,
    });
    this.showContactoDialog = false;
    this.mensajeContacto = '';
  }

  nombreCompleto(eg: Egresado) { return egresadoNombreCompleto(eg); }
}
