import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { SliderModule } from 'primeng/slider';
import { InputTextModule } from 'primeng/inputtext';
import { VacanteService } from '../../../core/services/vacante.service';
import { EgresadoService } from '../../../core/services/egresado.service';
import { ScoreCircleComponent } from '../../../shared/components/score-circle/score-circle.component';
import { DimensionPillComponent } from '../../../shared/components/dimension-pill/dimension-pill.component';
import { Vacante, Egresado, DimensionType } from '../../../core/models';

@Component({
  selector: 'app-vacantes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    ButtonModule, DropdownModule, SliderModule, InputTextModule,
    ScoreCircleComponent, DimensionPillComponent,
  ],
  templateUrl: './vacantes.component.html',
  styleUrls: ['./vacantes.component.scss'],
})
export class VacantesComponent implements OnInit {
  vacantes: Vacante[]       = [];
  egresado?: Egresado;
  loading = true;
  busqueda   = '';
  areaFiltro = '';
  minCoincidencia = 0;

  readonly DIMS: DimensionType[] = ['psicometrica', 'cognitiva', 'tecnica', 'proyectiva'];

  readonly areasOpciones = [
    { label: 'Todas las áreas', value: '' },
    { label: 'Tecnologías de la Información', value: 'Tecnologías de la Información' },
    { label: 'Mantenimiento Industrial',       value: 'Mantenimiento Industrial' },
    { label: 'Logística y Transporte',          value: 'Logística y Transporte' },
    { label: 'Mecatrónica e Industria 4.0',     value: 'Mecatrónica e Industria 4.0' },
    { label: 'Gestión Empresarial',             value: 'Gestión Empresarial' },
  ];

  private vacanteSvc  = inject(VacanteService);
  private egresadoSvc = inject(EgresadoService);

  get vacantesFiltradas(): Vacante[] {
    return this.vacantes
      .filter(v => {
        const coincide = v.coincidencia ?? 0;
        const texto    = `${v.puesto} ${v.empresa_nombre} ${v.ubicacion}`.toLowerCase();
        return (
          coincide >= this.minCoincidencia &&
          (!this.areaFiltro || v.area === this.areaFiltro) &&
          (!this.busqueda || texto.includes(this.busqueda.toLowerCase()))
        );
      })
      .sort((a, b) => (b.coincidencia ?? 0) - (a.coincidencia ?? 0));
  }

  ngOnInit() {
    this.egresadoSvc.getEgresadoActual().subscribe(e => {
      this.egresado = e;
      this.vacanteSvc.getVacantes().subscribe(vacs => {
        this.vacantes = vacs.map(v => ({
          ...v,
          coincidencia: e.scores
            ? this.vacanteSvc.calcularCoincidencia(e.scores, v.perfil_ideal)
            : undefined,
        }));
        this.loading = false;
      });
    });
  }

  scoreColor(pct?: number): string {
    if (!pct) return '#9ca3af';
    if (pct >= 80) return '#03837b';
    if (pct >= 60) return '#3b82f6';
    return '#f97316';
  }
}
