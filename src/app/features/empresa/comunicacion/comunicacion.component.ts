import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';

interface Mensaje {
  id: string;
  candidato: string;
  initials: string;
  asunto: string;
  preview: string;
  fecha: string;
  leido: boolean;
  tipo: 'enviado' | 'recibido';
}

@Component({
  selector: 'app-comunicacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, BadgeModule],
  templateUrl: './comunicacion.component.html',
  styleUrls: ['./comunicacion.component.scss'],
})
export class ComunicacionComponent {
  mensajes: Mensaje[] = [
    { id: 'm1', candidato: 'Carlos Mendoza López',  initials: 'CM', asunto: 'Entrevista — Desarrollador Full Stack', preview: 'Estimado Carlos, nos complace invitarte a una entrevista para el puesto de...', fecha: '2024-03-12', leido: false, tipo: 'enviado' },
    { id: 'm2', candidato: 'Sofía Hernández Cruz',  initials: 'SH', asunto: 'Información adicional solicitada',     preview: 'Hola Sofía, gracias por postularte. Necesitamos algunos documentos...', fecha: '2024-03-10', leido: true,  tipo: 'enviado' },
    { id: 'm3', candidato: 'María García Ramírez',  initials: 'MG', asunto: 'Actualización — Coordinador Logística', preview: 'Buenos días, queremos informarle que su solicitud ha pasado a la siguiente fase...', fecha: '2024-03-08', leido: true,  tipo: 'recibido' },
  ];

  selectedMensaje?: Mensaje;
  nuevoMensaje = '';

  get noLeidos() { return this.mensajes.filter(m => !m.leido).length; }

  seleccionar(m: Mensaje) {
    this.selectedMensaje = m;
    m.leido = true;
  }

  enviarRespuesta() {
    if (!this.nuevoMensaje.trim()) return;
    this.nuevoMensaje = '';
  }

  nuevo() { this.selectedMensaje = undefined; }
}
