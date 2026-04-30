import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { EmpresaService } from '../../../core/services/empresa.service';
import { EgresadoService } from '../../../core/services/egresado.service';
import { MensajeService as BolsaMensajeService, MensajeView } from '../../../core/services/mensaje.service';
import { egresadoNombreCompleto } from '../../../core/models';

@Component({
  selector: 'app-comunicacion',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, BadgeModule, ToastModule],
  providers: [MessageService],
  templateUrl: './comunicacion.component.html',
  styleUrls: ['./comunicacion.component.scss'],
})
export class ComunicacionComponent implements OnInit {
  mensajes: MensajeView[] = [];

  selectedMensaje?: MensajeView;
  composeMode = false;
  contactoDestino = '';
  contactoInitials = '';
  contactoEgresadoId = '';
  contactoVacanteId = '';
  contactoAsunto = '';
  nuevoMensaje = '';

  private route = inject(ActivatedRoute);
  private empresaSvc = inject(EmpresaService);
  private egresadoSvc = inject(EgresadoService);
  private mensajeSvc = inject(BolsaMensajeService);
  private msgSvc = inject(MessageService);

  get noLeidos() { return this.mensajes.filter(m => !m.leido).length; }

  ngOnInit() {
    this.empresaSvc.getEmpresaActual().subscribe(empresa => {
      this.mensajeSvc.porEmpresa(empresa.id).subscribe(mensajes => {
        this.mensajes = mensajes;
        this.selectedMensaje = mensajes[0];
      });
    });

    this.route.queryParamMap.subscribe(params => {
      const egresadoId = params.get('candidato');
      if (!egresadoId) return;

      this.contactoVacanteId = params.get('vacanteId') ?? '';
      this.egresadoSvc.getEgresados().subscribe(egresados => {
        const egresado = egresados.find(e => e.id === egresadoId);
        if (!egresado) return;

        const nombre = egresadoNombreCompleto(egresado);
        this.composeMode = true;
        this.selectedMensaje = undefined;
        this.contactoDestino = nombre;
        this.contactoInitials = this.initials(nombre);
        this.contactoEgresadoId = egresado.id;
        this.contactoAsunto = `Vacante: ${params.get('vacante') ?? 'Proceso de seleccion'}`;
        this.nuevoMensaje = `Hola ${egresado.nombre}, tu perfil coincide con nuestra vacante y nos gustaria iniciar contacto contigo.`;
      });
    });
  }

  seleccionar(m: MensajeView) {
    this.selectedMensaje = m;
    this.composeMode = false;
    if (!m.leido) {
      this.mensajeSvc.marcarLeido(m.id).subscribe(() => m.leido = true);
    }
  }

  enviarRespuesta() {
    if (!this.nuevoMensaje.trim()) return;

    const payload = this.composeMode
      ? {
          cve_egresado: this.contactoEgresadoId,
          cve_vacante: this.contactoVacanteId,
        }
      : {
          cve_postulacion: this.selectedMensaje?.postulacionId,
          cve_egresado: this.selectedMensaje?.egresadoId,
          cve_vacante: this.selectedMensaje?.vacanteId,
        };

    if (!payload.cve_postulacion && (!payload.cve_egresado || !payload.cve_vacante)) {
      this.msgSvc.add({ severity: 'warn', summary: 'Falta contexto', detail: 'Selecciona un candidato y una vacante para enviar el mensaje.' });
      return;
    }

    this.mensajeSvc.enviar({
      ...payload,
      remitente: 'empresa',
      contenido: this.nuevoMensaje,
    }).subscribe({
      next: mensaje => {
        const visible = {
          ...mensaje,
          candidato: this.composeMode ? this.contactoDestino : (this.selectedMensaje?.candidato ?? mensaje.candidato),
          initials: this.composeMode ? this.contactoInitials : (this.selectedMensaje?.initials ?? mensaje.initials),
          asunto: this.composeMode ? (this.contactoAsunto || mensaje.asunto) : `Re: ${this.selectedMensaje!.asunto.replace(/^Re: /, '')}`,
          tipo: 'enviado' as const,
          leido: true,
        };

        this.mensajes = [visible, ...this.mensajes];
        this.selectedMensaje = visible;
        this.composeMode = false;
        this.nuevoMensaje = '';
        this.msgSvc.add({ severity: 'success', summary: 'Mensaje enviado', detail: `Se envio el mensaje a ${visible.candidato}.` });
      },
      error: err => this.msgSvc.add({ severity: 'error', summary: 'No se pudo enviar', detail: err.message })
    });
  }

  nuevo() {
    this.selectedMensaje = undefined;
    this.composeMode = true;
    this.contactoDestino = '';
    this.contactoInitials = '';
    this.contactoEgresadoId = '';
    this.contactoVacanteId = '';
    this.contactoAsunto = '';
    this.nuevoMensaje = '';
  }

  private initials(nombre: string): string {
    const parts = nombre.trim().split(/\s+/);
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
}
