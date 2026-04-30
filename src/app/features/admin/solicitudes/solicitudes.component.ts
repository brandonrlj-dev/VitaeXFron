import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { EmpresaService } from '../../../core/services/empresa.service';
import { AdminService } from '../../../core/services/admin.service';
import { SolicitudConvenio, EstatusSolicitud } from '../../../core/models';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule,
    DialogModule, TagModule, ToastModule, InputTextModule, TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.scss'],
})
export class SolicitudesComponent implements OnInit {
  solicitudes: SolicitudConvenio[] = [];
  loading = true;

  selectedSolicitud?: SolicitudConvenio;
  showDetalle      = false;
  motivoRechazo    = '';
  showRechazarForm = false;
  procesando       = false;

  private empresaSvc = inject(EmpresaService);
  private adminSvc   = inject(AdminService);
  private msgSvc     = inject(MessageService);

  ngOnInit() {
    this.empresaSvc.getSolicitudes().subscribe({
      next: solicitudes => {
        this.solicitudes = solicitudes;
        this.loading = false;
      },
      error: (err: Error) => {
        this.loading = false;
        this.msgSvc.add({ severity: 'error', summary: 'No se pudieron cargar', detail: err.message });
      }
    });
  }

  verDetalle(s: SolicitudConvenio) {
    this.selectedSolicitud = { ...s };
    this.showDetalle       = true;
    this.showRechazarForm  = false;
    this.motivoRechazo     = '';
  }

  cambiarEstatus(nuevoEstatus: EstatusSolicitud) {
    if (!this.selectedSolicitud) return;
    this.procesando = true;

    if (nuevoEstatus === 'rechazada' && !this.showRechazarForm) {
      this.showRechazarForm = true;
      this.procesando = false;
      return;
    }

    this.empresaSvc.actualizarSolicitudEstado(
      this.selectedSolicitud.id,
      nuevoEstatus,
      nuevoEstatus === 'rechazada' ? this.motivoRechazo : undefined
    ).subscribe({
      next: solicitud => {
        this.selectedSolicitud = solicitud;
        this.actualizarSolicitud(solicitud);
        this.procesando = false;
        this.showRechazarForm = false;
        this.msgSvc.add({
          severity: this.estatusSeverity(solicitud.estatus),
          summary: 'Estatus actualizado',
          detail: `La solicitud ahora esta ${this.estatusLabel(solicitud.estatus).toLowerCase()}.`
        });
      },
      error: (err: Error) => {
        this.procesando = false;
        this.msgSvc.add({ severity: 'error', summary: 'No se pudo actualizar', detail: err.message });
      }
    });
  }

  aprobar() {
    this.cambiarEstatus('aprobada');
  }

  rechazar() {
    this.cambiarEstatus('rechazada');
  }

  cambiarEstatusDirecto(s: SolicitudConvenio, nuevoEstatus: EstatusSolicitud) {
    this.procesando = true;
    this.empresaSvc.actualizarSolicitudEstado(s.id, nuevoEstatus).subscribe({
      next: solicitud => {
        this.actualizarSolicitud(solicitud);
        this.procesando = false;
        this.msgSvc.add({
          severity: this.estatusSeverity(solicitud.estatus),
          summary: 'Estatus actualizado',
          detail: `Se actualizo el estatus de ${solicitud.empresa_nombre}.`
        });
      },
      error: (err: Error) => {
        this.procesando = false;
        this.msgSvc.add({ severity: 'error', summary: 'No se pudo actualizar', detail: err.message });
      }
    });
  }

  formalizarSolicitud() {
    if (!this.selectedSolicitud) return;
    this.procesando = true;
    this.adminSvc.formalizarSolicitud(this.selectedSolicitud.id).subscribe({
      next: solicitud => {
        this.selectedSolicitud = solicitud;
        this.actualizarSolicitud(solicitud);
        this.procesando = false;
        this.showDetalle = false;
        this.msgSvc.add({
          severity: 'success',
          summary: 'Solicitud formalizada',
          detail: `${solicitud.empresa_nombre} quedo formalizada desde el backend.`
        });
      },
      error: (err: Error) => {
        this.procesando = false;
        this.msgSvc.add({ severity: 'error', summary: 'No se pudo formalizar', detail: err.message });
      }
    });
  }

  private actualizarSolicitud(solicitud: SolicitudConvenio) {
    const idx = this.solicitudes.findIndex(s => s.id === solicitud.id);
    if (idx >= 0) this.solicitudes[idx] = solicitud;
  }

  estatusSeverity(estatus: string): any {
    const map: Record<string, string> = { pendiente: 'warning', en_proceso: 'info', aprobada: 'success', rechazada: 'danger' };
    return map[estatus];
  }

  get pendientesCount(): number {
    return this.solicitudes.filter(s => s.estatus === 'pendiente' || s.estatus === 'en_proceso').length;
  }

  estatusLabel(estatus: string): string {
    const map: Record<string, string> = { pendiente: 'Pendiente', en_proceso: 'En proceso', aprobada: 'Aprobada', rechazada: 'Rechazada' };
    return map[estatus] ?? estatus;
  }
}
