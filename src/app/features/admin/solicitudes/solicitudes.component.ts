import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
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
  providers: [MessageService, ConfirmationService],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.scss'],
})
export class SolicitudesComponent implements OnInit {
  solicitudes: SolicitudConvenio[] = [];
  loading = true;

  selectedSolicitud?: SolicitudConvenio;
  showDetalle      = false;
  showCredDialog   = false;
  motivoRechazo    = '';
  showRechazarForm = false;
  procesando       = false;

  credenciales?: { email: string; password: string };

  private empresaSvc = inject(EmpresaService);
  private adminSvc   = inject(AdminService);
  private msgSvc     = inject(MessageService);

  ngOnInit() {
    this.empresaSvc.getSolicitudes().subscribe(s => {
      this.solicitudes = s;
      this.loading     = false;
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
    
    // Si es rechazar, mostramos el form de motivo primero si no se ha ingresado
    if (nuevoEstatus === 'rechazada' && !this.showRechazarForm) {
      this.showRechazarForm = true;
      this.procesando = false;
      return;
    }

    const obs = nuevoEstatus === 'aprobada' 
      ? this.empresaSvc.aprobarSolicitud(this.selectedSolicitud.id)
      : nuevoEstatus === 'rechazada'
        ? this.empresaSvc.rechazarSolicitud(this.selectedSolicitud.id, this.motivoRechazo)
        : of(undefined).pipe(delay(500)); // Simulamos para pendiente/en_proceso

    obs.subscribe(() => {
      this.selectedSolicitud!.estatus = nuevoEstatus;
      this.actualizarLista(this.selectedSolicitud!.id, nuevoEstatus);
      this.procesando = false;
      this.showRechazarForm = false;
      this.msgSvc.add({ 
        severity: this.estatusSeverity(nuevoEstatus), 
        summary: 'Estatus actualizado', 
        detail: `La solicitud ahora está ${this.estatusLabel(nuevoEstatus).toLowerCase()}.` 
      });
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
    const obs = nuevoEstatus === 'aprobada' 
      ? this.empresaSvc.aprobarSolicitud(s.id)
      : of(undefined).pipe(delay(500));

    obs.subscribe(() => {
      this.actualizarLista(s.id, nuevoEstatus);
      this.procesando = false;
      this.msgSvc.add({ 
        severity: this.estatusSeverity(nuevoEstatus), 
        summary: 'Estatus actualizado', 
        detail: `Se actualizó el estatus de ${s.empresa_nombre}.` 
      });
    });
  }

  crearCuenta() {
    if (!this.selectedSolicitud) return;
    this.procesando = true;
    this.adminSvc.crearCuentaEmpresa(this.selectedSolicitud.id).subscribe(creds => {
      this.credenciales = creds;
      this.procesando   = false;
      this.showDetalle  = false;
      this.showCredDialog = true;
    });
  }

  private actualizarLista(id: string, estatus: EstatusSolicitud) {
    const idx = this.solicitudes.findIndex(s => s.id === id);
    if (idx >= 0) this.solicitudes[idx] = { ...this.solicitudes[idx], estatus };
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
