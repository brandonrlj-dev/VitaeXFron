import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { EgresadoService } from '../../../core/services/egresado.service';
import { VacanteService } from '../../../core/services/vacante.service';
import { Postulacion } from '../../../core/models';

@Component({
  selector: 'app-postulaciones',
  standalone: true,
  imports: [CommonModule, RouterLink, TableModule, ButtonModule, TagModule, ToastModule, TooltipModule],
  providers: [MessageService],
  templateUrl: './postulaciones.component.html',
  styleUrls: ['./postulaciones.component.scss'],
})
export class PostulacionesComponent implements OnInit {
  postulaciones: Postulacion[] = [];
  contrataciones: any[]        = [];
  loading          = true;
  confirmandoId    = '';
  egresadoId       = '';

  private egresadoSvc = inject(EgresadoService);
  private vacanteSvc  = inject(VacanteService);
  private msgSvc      = inject(MessageService);

  ngOnInit() {
    this.egresadoSvc.getEgresadoActual().subscribe({
      next: egresado => {
        this.egresadoId = egresado.id;
        forkJoin({
          posts: this.vacanteSvc.getPostulacionesEgresado(egresado.id),
          conts: this.vacanteSvc.getContratacionesEgresado(egresado.id),
        }).subscribe({
          next: ({ posts, conts }) => {
            this.postulaciones  = posts;
            this.contrataciones = conts;
            this.loading        = false;
          },
          error: () => this.loading = false,
        });
      },
      error: () => this.loading = false,
    });
  }

  contratacionPara(postulacionId: string): any | undefined {
    return this.contrataciones.find(
      c => String(c.cve_postulacion) === String(postulacionId) && !c.confirmada_egresado
    );
  }

  confirmarContratacion(postulacionId: string) {
    const cont = this.contratacionPara(postulacionId);
    if (!cont) return;
    this.confirmandoId = postulacionId;
    this.vacanteSvc.confirmarContratacion(String(cont.cve_contratacion)).subscribe({
      next: () => {
        cont.confirmada_egresado = true;
        this.confirmandoId = '';
        const post = this.postulaciones.find(p => p.id === postulacionId);
        if (post) post.estatus = 'contratado';
        this.msgSvc.add({ severity: 'success', summary: '¡Contratación confirmada!', detail: 'Tu contratación quedó registrada correctamente.' });
      },
      error: (err: any) => {
        this.confirmandoId = '';
        this.msgSvc.add({ severity: 'error', summary: 'Error', detail: err.message ?? 'No se pudo confirmar.' });
      }
    });
  }

  estatusSeverity(estatus: string): 'success' | 'info' | 'warning' | 'danger' | undefined {
    const map: Record<string, any> = {
      enviada:     'info',
      en_revision: 'info',
      entrevista:  'warning',
      aceptada:    'success',
      contratado:  'success',
      rechazada:   'danger',
    };
    return map[estatus];
  }

  estatusLabel(estatus: string): string {
    const map: Record<string, string> = {
      enviada:     'Enviada',
      en_revision: 'En revision',
      entrevista:  'Entrevista',
      aceptada:    'Aceptada',
      contratado:  'Contratado',
      rechazada:   'Rechazada',
    };
    return map[estatus] ?? estatus;
  }
}
