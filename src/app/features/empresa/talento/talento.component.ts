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
import { EgresadoService } from '../../../core/services/egresado.service';
import { MensajeService as BolsaMensajeService } from '../../../core/services/mensaje.service';
import { ScoreCircleComponent } from '../../../shared/components/score-circle/score-circle.component';
import { DimensionPillComponent } from '../../../shared/components/dimension-pill/dimension-pill.component';
import { SpiderChartComponent } from '../../../shared/components/spider-chart/spider-chart.component';
import { Egresado, Vacante, DimensionType, egresadoNombreCompleto } from '../../../core/models';

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
  candidatos: { egresado: Egresado; coincidencia: number }[] = [];
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
  private egresadoSvc = inject(EgresadoService);
  private mensajeSvc = inject(BolsaMensajeService);
  private msgSvc = inject(MessageService);

  get vacanteOpciones() {
    return this.vacantes.map(v => ({ label: v.puesto, value: v.id }));
  }

  get vacanteSeleccionada() {
    return this.vacantes.find(v => v.id === this.selectedVacanteId) ?? this.vacantes[0];
  }

  get egresadosFiltrados() {
    return this.candidatos
      .filter(c => c.egresado.scores && c.egresado.evaluaciones_completadas.length === 4)
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
    this.egresadoSvc.getEgresados().subscribe(egresados => {
      this.egresados = egresados;
      this.hidratarCandidatos();
    });

    this.empresaSvc.getEmpresaActual().subscribe(empresa => {
      this.empresaSvc.getVacantesEmpresa(empresa.id).subscribe(vacantes => {
        this.vacantes = vacantes.filter(v => v.activa);
        this.selectedVacanteId = this.vacantes[0]?.id ?? '';
        this.cargarCandidatos();
      });
    });
  }

  cargarCandidatos() {
    if (!this.selectedVacanteId) {
      this.candidatos = [];
      return;
    }

    this.vacanteSvc.getCandidatosVacante(this.selectedVacanteId, 80).subscribe({
      next: candidatos => {
        this.candidatos = candidatos;
        this.hidratarCandidatos();
      },
      error: (err) => {
        this.candidatos = [];
        this.msgSvc.add({ severity: 'error', summary: 'No se pudieron cargar', detail: err.message });
      }
    });
  }

  private hidratarCandidatos() {
    if (!this.egresados.length || !this.candidatos.length) return;
    const egresadosById = new Map(this.egresados.map(egresado => [egresado.id, egresado]));
    this.candidatos = this.candidatos.map(candidato => ({
      ...candidato,
      egresado: egresadosById.get(candidato.egresado.id) ?? candidato.egresado,
    }));
  }

  verPerfil(eg: Egresado) {
    this.selectedEgresado = eg;
    this.showDialog       = true;
  }

  contactar(eg: Egresado) {
    this.selectedContacto = eg;
    this.mensajeContacto = `Hola ${eg.nombre}, tu perfil coincide con la vacante ${this.vacanteSeleccionada?.puesto ?? 'publicada'} y nos gustaria iniciar contacto contigo.`;
    this.showContactoDialog = true;
  }

  enviarContacto() {
    if (!this.selectedContacto || !this.mensajeContacto.trim() || !this.selectedVacanteId) return;
    this.mensajeSvc.enviar({
      cve_egresado: this.selectedContacto.id,
      cve_vacante: this.selectedVacanteId,
      remitente: 'empresa',
      contenido: this.mensajeContacto,
    }).subscribe({
      next: () => {
        this.msgSvc.add({
          severity: 'success',
          summary: 'Mensaje enviado',
          detail: `Se contacto a ${this.nombreCompleto(this.selectedContacto!)}.`,
        });
        this.showContactoDialog = false;
        this.mensajeContacto = '';
      },
      error: (err) => {
        this.msgSvc.add({
          severity: 'error',
          summary: 'No se pudo enviar',
          detail: err.message,
        });
      }
    });
  }

  nombreCompleto(eg: Egresado) { return egresadoNombreCompleto(eg); }
}
