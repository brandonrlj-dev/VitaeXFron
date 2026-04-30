import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { EgresadoService } from '../../../core/services/egresado.service';
import { VacanteService } from '../../../core/services/vacante.service';
import { Postulacion } from '../../../core/models';

@Component({
  selector: 'app-postulaciones',
  standalone: true,
  imports: [CommonModule, RouterLink, TableModule, ButtonModule, TagModule],
  templateUrl: './postulaciones.component.html',
  styleUrls: ['./postulaciones.component.scss'],
})
export class PostulacionesComponent implements OnInit {
  postulaciones: Postulacion[] = [];
  loading = true;

  private egresadoSvc = inject(EgresadoService);
  private vacanteSvc = inject(VacanteService);

  ngOnInit() {
    this.egresadoSvc.getEgresadoActual().subscribe({
      next: egresado => {
        this.vacanteSvc.getPostulacionesEgresado(egresado.id).subscribe({
          next: postulaciones => {
            this.postulaciones = postulaciones;
            this.loading = false;
          },
          error: () => this.loading = false,
        });
      },
      error: () => this.loading = false,
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
