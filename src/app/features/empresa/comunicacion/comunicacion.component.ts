import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { EGRESADOS_MOCK } from '../../../shared/mocks/egresados.mock';
import { egresadoNombreCompleto } from '../../../core/models';

interface Mensaje {
  id: string;
  candidato: string;
  egresadoId?: string;
  initials: string;
  asunto: string;
  preview: string;
  contenido: string;
  fecha: string;
  leido: boolean;
  tipo: 'enviado' | 'recibido';
}

@Component({
  selector: 'app-comunicacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, BadgeModule, ToastModule],
  providers: [MessageService],
  templateUrl: './comunicacion.component.html',
  styleUrls: ['./comunicacion.component.scss'],
})
export class ComunicacionComponent implements OnInit {
  mensajes: Mensaje[] = [
    { id: 'm1', egresadoId: '1', candidato: 'Carlos Mendoza López', initials: 'CM', asunto: 'Entrevista - Desarrollador Full Stack', preview: 'Estimado Carlos, nos complace invitarte a una entrevista para el puesto de...', contenido: 'Estimado Carlos, nos complace invitarte a una entrevista para el puesto de Desarrollador Full Stack. ¿Tendrías disponibilidad esta semana?', fecha: '2024-03-12', leido: false, tipo: 'enviado' },
    { id: 'm2', egresadoId: '4', candidato: 'Sofía Hernández Cruz', initials: 'SH', asunto: 'Información adicional solicitada', preview: 'Hola Sofía, gracias por postularte. Necesitamos algunos documentos...', contenido: 'Hola Sofía, gracias por postularte. Necesitamos algunos documentos adicionales para continuar con tu proceso.', fecha: '2024-03-10', leido: true, tipo: 'enviado' },
    { id: 'm3', egresadoId: '2', candidato: 'María García Ramírez', initials: 'MG', asunto: 'Actualización - Coordinador Logística', preview: 'Buenos días, queremos informarle que su solicitud ha pasado a la siguiente fase...', contenido: 'Buenos días, queremos informarle que su solicitud ha pasado a la siguiente fase. En breve compartiremos los horarios disponibles.', fecha: '2024-03-08', leido: true, tipo: 'recibido' },
  ];

  selectedMensaje?: Mensaje;
  composeMode = false;
  contactoDestino = '';
  contactoInitials = '';
  contactoEgresadoId = '';
  contactoAsunto = '';
  nuevoMensaje = '';

  private route = inject(ActivatedRoute);
  private msgSvc = inject(MessageService);

  get noLeidos() { return this.mensajes.filter(m => !m.leido).length; }

  ngOnInit() {
    this.route.queryParamMap.subscribe(params => {
      const egresadoId = params.get('candidato');
      if (!egresadoId) return;

      const egresado = EGRESADOS_MOCK.find(e => e.id === egresadoId);
      if (!egresado) return;

      const nombre = egresadoNombreCompleto(egresado);
      this.composeMode = true;
      this.selectedMensaje = undefined;
      this.contactoDestino = nombre;
      this.contactoInitials = this.initials(nombre);
      this.contactoEgresadoId = egresado.id;
      this.contactoAsunto = `Vacante: ${params.get('vacante') ?? 'Proceso de selección'}`;
      this.nuevoMensaje = `Hola ${egresado.nombre}, tu perfil coincide con nuestra vacante y nos gustaría iniciar contacto contigo.`;
    });
  }

  seleccionar(m: Mensaje) {
    this.selectedMensaje = m;
    this.composeMode = false;
    m.leido = true;
  }

  enviarRespuesta() {
    if (!this.nuevoMensaje.trim()) return;
    const base = this.composeMode
      ? {
          candidato: this.contactoDestino,
          initials: this.contactoInitials || this.initials(this.contactoDestino),
          asunto: this.contactoAsunto || 'Nuevo mensaje',
          egresadoId: this.contactoEgresadoId || undefined,
        }
      : {
          candidato: this.selectedMensaje!.candidato,
          initials: this.selectedMensaje!.initials,
          asunto: `Re: ${this.selectedMensaje!.asunto.replace(/^Re: /, '')}`,
          egresadoId: this.selectedMensaje!.egresadoId,
        };

    const mensaje: Mensaje = {
      id: `m${Date.now()}`,
      ...base,
      preview: this.nuevoMensaje,
      contenido: this.nuevoMensaje,
      fecha: new Date().toISOString().split('T')[0],
      leido: true,
      tipo: 'enviado',
    };

    this.mensajes = [mensaje, ...this.mensajes];
    this.selectedMensaje = mensaje;
    this.composeMode = false;
    this.nuevoMensaje = '';
    this.msgSvc.add({ severity: 'success', summary: 'Mensaje enviado', detail: `Se envió el mensaje a ${mensaje.candidato}.` });
  }

  nuevo() {
    this.selectedMensaje = undefined;
    this.composeMode = true;
    this.contactoDestino = '';
    this.contactoInitials = '';
    this.contactoEgresadoId = '';
    this.contactoAsunto = '';
    this.nuevoMensaje = '';
  }

  private initials(nombre: string): string {
    const parts = nombre.trim().split(/\s+/);
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
}
