import { Component, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BadgeModule } from 'primeng/badge';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { EgresadoService } from '../../../core/services/egresado.service';
import { VacanteService } from '../../../core/services/vacante.service';
import { Mensaje, Postulacion } from '../../../core/models';

interface Conversacion {
  postulacion_id: string;
  vacante:        string;
  empresa:        string;
  mensajes:       Mensaje[];
  no_leidos:      number;
  ultimo_mensaje?: Mensaje;
}

@Component({
  selector: 'app-mensajeria-egresado',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, BadgeModule, ToastModule],
  providers: [MessageService],
  templateUrl: './mensajeria-egresado.component.html',
  styleUrls: ['./mensajeria-egresado.component.scss'],
})
export class MensajeriaEgresadoComponent implements OnInit {
  @ViewChild('threadEnd') threadEnd!: ElementRef<HTMLDivElement>;

  conversaciones: Conversacion[] = [];
  conversacionActiva?: Conversacion;
  nuevoMensaje = '';
  loading      = true;
  enviando     = false;
  egresadoId   = '';

  private egresadoSvc = inject(EgresadoService);
  private vacanteSvc  = inject(VacanteService);
  private msgSvc      = inject(MessageService);

  ngOnInit() {
    this.egresadoSvc.getEgresadoActual().subscribe(e => {
      this.egresadoId = e.id;
      this.cargarMensajes();
    });
  }

  private cargarMensajes() {
    this.loading = true;

    Promise.all([
      this.egresadoSvc.getMensajes(this.egresadoId).toPromise(),
      this.vacanteSvc.getPostulacionesEgresado(this.egresadoId).toPromise(),
    ]).then(([mensajes, postulaciones]) => {
      const msgs: Mensaje[] = mensajes ?? [];
      const posts: Postulacion[] = (postulaciones ?? []) as Postulacion[];
      this.conversaciones = this.agruparConversaciones(msgs, posts);
      this.loading = false;
    }).catch(() => {
      this.loading = false;
    });
  }

  private agruparConversaciones(mensajes: Mensaje[], postulaciones: Postulacion[]): Conversacion[] {
    const mapa = new Map<string, Conversacion>();

    for (const m of mensajes) {
      const pid = m.postulacion_id;
      if (!mapa.has(pid)) {
        const post = postulaciones.find(p => p.id === pid);
        mapa.set(pid, {
          postulacion_id: pid,
          vacante:  m.vacante ?? post?.puesto ?? 'Vacante',
          empresa:  post?.empresa_nombre ?? 'Empresa',
          mensajes: [],
          no_leidos: 0,
        });
      }
      const conv = mapa.get(pid)!;
      conv.mensajes.push(m);
      if (!m.leido && m.tipo_emisor !== 'egresado') conv.no_leidos++;
    }

    // Ordenar mensajes cronológicamente dentro de cada conversación
    for (const conv of mapa.values()) {
      conv.mensajes.sort((a, b) => a.fecha_envio.localeCompare(b.fecha_envio));
      conv.ultimo_mensaje = conv.mensajes[conv.mensajes.length - 1];
    }

    return [...mapa.values()].sort((a, b) =>
      (b.ultimo_mensaje?.fecha_envio ?? '').localeCompare(a.ultimo_mensaje?.fecha_envio ?? '')
    );
  }

  seleccionarConversacion(conv: Conversacion) {
    this.conversacionActiva = conv;
    // Marcar como leídos
    conv.mensajes
      .filter(m => !m.leido && m.tipo_emisor !== 'egresado')
      .forEach(m => {
        this.egresadoSvc.marcarMensajeLeido(m.id).subscribe(() => { m.leido = true; });
      });
    conv.no_leidos = 0;
    setTimeout(() => this.scrollToBottom(), 80);
  }

  enviar() {
    const texto = this.nuevoMensaje.trim();
    if (!texto || !this.conversacionActiva || this.enviando) return;

    this.enviando = true;
    this.egresadoSvc.enviarMensaje(this.conversacionActiva.postulacion_id, texto).subscribe({
      next: msg => {
        this.conversacionActiva!.mensajes.push(msg);
        this.conversacionActiva!.ultimo_mensaje = msg;
        this.nuevoMensaje = '';
        this.enviando = false;
        setTimeout(() => this.scrollToBottom(), 60);
      },
      error: (err: any) => {
        this.enviando = false;
        this.msgSvc.add({ severity: 'error', summary: 'Error', detail: err.message ?? 'No se pudo enviar el mensaje.' });
      }
    });
  }

  onEnter(event: Event) {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) { ke.preventDefault(); this.enviar(); }
  }

  get totalNoLeidos(): number {
    return this.conversaciones.reduce((s, c) => s + c.no_leidos, 0);
  }

  formatFecha(fecha: string): string {
    if (!fecha) return '';
    return new Date(fecha).toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  private scrollToBottom() {
    this.threadEnd?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
  }
}
