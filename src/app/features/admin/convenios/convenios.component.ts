import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { RouterLink } from '@angular/router';
import { EmpresaService } from '../../../core/services/empresa.service';
import { Empresa, EstatusConvenio } from '../../../core/models';

@Component({
  selector: 'app-convenios',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, TooltipModule, RouterLink],
  templateUrl: './convenios.component.html',
  styleUrls: ['./convenios.component.scss'],
})
export class ConveniosComponent implements OnInit {
  empresas: Empresa[]   = [];
  loading = true;
  filtroEstatus = '';

  private empresaSvc = inject(EmpresaService);

  get empresasFiltradas() {
    if (!this.filtroEstatus) return this.empresas;
    return this.empresas.filter(e => e.estatus_convenio === this.filtroEstatus);
  }

  ngOnInit() {
    this.empresaSvc.getEmpresas().subscribe(e => {
      this.empresas = e;
      this.loading  = false;
    });
  }

  estatusSeverity(estatus: EstatusConvenio): 'success' | 'warning' | 'info' | 'danger' | undefined {
    const map: Record<string, any> = {
      activo:     'success',
      por_vencer: 'warning',
      pendiente:  'info',
      inactivo:   'danger',
    };
    return map[estatus];
  }

  estatusLabel(estatus: string): string {
    const map: Record<string, string> = {
      activo: 'Activo', por_vencer: 'Por vencer', pendiente: 'Pendiente', inactivo: 'Inactivo'
    };
    return map[estatus] ?? estatus;
  }

  tipoLabel(tipo: string): string {
    const map: Record<string, string> = {
      automatico:   'Automático',
      contratacion: 'Por contratación',
      solicitud:    'Por solicitud',
      ninguno:      'Sin convenio',
    };
    return map[tipo] ?? tipo;
  }
}
