import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { POSTULACIONES_MOCK } from '../../../shared/mocks/egresados.mock';
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

  ngOnInit() {
    setTimeout(() => {
      this.postulaciones = POSTULACIONES_MOCK;
      this.loading = false;
    }, 400);
  }

  estatusSeverity(estatus: string): 'success' | 'info' | 'warning' | 'danger' | undefined {
    const map: Record<string, any> = {
      enviada:     'info',
      en_revision: 'info',
      entrevista:  'warning',
      aceptada:    'success',
      rechazada:   'danger',
    };
    return map[estatus];
  }

  estatusLabel(estatus: string): string {
    const map: Record<string, string> = {
      enviada:     'Enviada',
      en_revision: 'En revisión',
      entrevista:  'Entrevista',
      aceptada:    'Aceptada',
      rechazada:   'Rechazada',
    };
    return map[estatus] ?? estatus;
  }
}
