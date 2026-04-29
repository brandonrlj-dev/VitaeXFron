import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { EgresadoService } from '../../../core/services/egresado.service';
import { Egresado, egresadoNombreCompleto } from '../../../core/models';

@Component({
  selector: 'app-confirmar-datos',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './confirmar-datos.component.html',
  styleUrls: ['./confirmar-datos.component.scss'],
})
export class ConfirmarDatosComponent implements OnInit {
  egresado?: Egresado;
  loading    = true;
  confirming = false;

  private egresadoSvc = inject(EgresadoService);
  private router      = inject(Router);

  get nombreCompleto() { return this.egresado ? egresadoNombreCompleto(this.egresado) : ''; }

  ngOnInit() {
    this.egresadoSvc.getEgresadoActual().subscribe(e => {
      this.egresado = e;
      this.loading  = false;
    });
  }

  confirmar() {
    if (!this.egresado) return;
    this.confirming = true;
    this.egresadoSvc.confirmarDatos(this.egresado.id).subscribe(() => {
      this.router.navigate(['/egresado/dashboard']);
    });
  }

  noSonMisDatos() {
    alert('Por favor contacta a la Unidad de Control Escolar para actualizar tus datos: controlescolar@utdelacosta.edu.mx');
  }
}
