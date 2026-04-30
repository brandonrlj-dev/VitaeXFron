import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { MessageService, ConfirmationService } from 'primeng/api';
import { EmpresaService } from '../../../core/services/empresa.service';
import { AdminService } from '../../../core/services/admin.service';
import { SolicitudConvenio, EstatusSolicitud } from '../../../core/models';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule,
    DialogModule, TagModule, ToastModule, InputTextModule,
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

  aprobar() {
    if (!this.selectedSolicitud) return;
    this.procesando = true;
    this.empresaSvc.aprobarSolicitud(this.selectedSolicitud.id).subscribe(() => {
      this.selectedSolicitud!.estatus = 'aprobada';
      this.actualizarLista(this.selectedSolicitud!.id, 'aprobada');
      this.procesando = false;
      this.msgSvc.add({ severity: 'success', summary: 'Solicitud aprobada', detail: 'Se aprobó el convenio con ' + this.selectedSolicitud!.empresa_nombre });
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

  rechazar() {
    if (!this.selectedSolicitud || !this.motivoRechazo.trim()) return;
    this.procesando = true;
    this.empresaSvc.rechazarSolicitud(this.selectedSolicitud.id, this.motivoRechazo).subscribe(() => {
      this.selectedSolicitud!.estatus = 'rechazada';
      this.actualizarLista(this.selectedSolicitud!.id, 'rechazada');
      this.procesando   = false;
      this.showDetalle  = false;
      this.msgSvc.add({ severity: 'info', summary: 'Solicitud rechazada', detail: 'Se notificará a la empresa.' });
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
