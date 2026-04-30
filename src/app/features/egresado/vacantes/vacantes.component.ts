import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { SliderModule } from 'primeng/slider';
import { InputTextModule } from 'primeng/inputtext';
import { VacanteService } from '../../../core/services/vacante.service';
import { EgresadoService } from '../../../core/services/egresado.service';
import { ScoreCircleComponent } from '../../../shared/components/score-circle/score-circle.component';
import { DimensionPillComponent } from '../../../shared/components/dimension-pill/dimension-pill.component';
import { Vacante, VacanteNacional, Egresado, DimensionType, DimensionScores } from '../../../core/models';

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
  vacantes: Vacante[]               = [];
  vacantesNacionales: VacanteNacional[] = [];
  egresado?: Egresado;
  loading = true;
  busqueda   = '';
  areaFiltro = '';
  minCoincidencia = 0;
  modo: 'bolsa' | 'nacional' = 'bolsa';

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

  get evaluacionesCompletas(): boolean {
    return this.DIMS.every(dim => this.egresado?.evaluaciones_completadas.includes(dim));
  }

  setModo(nuevoModo: 'bolsa' | 'nacional') {
    if (this.modo === nuevoModo) return;
    this.modo = nuevoModo;
    if (!this.evaluacionesCompletas) return;
    this.loading = true;
    if (this.modo === 'bolsa') {
      this.cargarVacantesLocales();
    } else {
      this.cargarVacantesNacionales();
    }
  }

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

  get vacantesNacionalesFiltradas(): VacanteNacional[] {
    return this.vacantesNacionales
      .filter(v => {
        const coincide = v.coincidencia ?? 0;
        const texto = `${v.puesto} ${v.empresa} ${v.ubicacion} ${v.fuente}`.toLowerCase();
        return (
          coincide >= this.minCoincidencia &&
          (!this.busqueda || texto.includes(this.busqueda.toLowerCase()))
        );
      })
      .sort((a, b) => (b.coincidencia ?? 0) - (a.coincidencia ?? 0));
  }

  ngOnInit() {
    this.egresadoSvc.getEgresadoActual().subscribe(e => {
      this.egresado = e;
      if (!this.evaluacionesCompletas) {
        this.loading = false;
        return;
      }
      this.cargarVacantesLocales();
    });
  }

  private cargarVacantesLocales() {
    forkJoin({
      vacs: this.vacanteSvc.getVacantes(),
      matching: this.egresado ? this.vacanteSvc.getMatchingEgresado(this.egresado.id) : of({} as Record<string, number>),
    }).subscribe(({ vacs, matching }) => {
      this.vacantes = vacs.map(v => ({
        ...v,
        coincidencia: matching[v.id] ?? (this.egresado?.scores
          ? this.vacanteSvc.calcularCoincidencia(this.egresado.scores, v.perfil_ideal)
          : undefined),
      }));
      this.loading = false;
    });
  }

  private cargarVacantesNacionales() {
    this.vacanteSvc.getVacantesNacionales().subscribe(vacs => {
      this.vacantesNacionales = vacs.map(vn => {
        const perfil = this.inferirPerfilIdeal(vn.puesto, vn.descripcion);
        const coincidencia = this.egresado?.scores
          ? this.vacanteSvc.calcularCoincidencia(this.egresado.scores, perfil)
          : undefined;
        return { ...vn, coincidencia, perfil_ideal_estimado: perfil };
      });
      this.loading = false;
    });
  }

  scoreColor(pct?: number): string {
    if (!pct) return '#9ca3af';
    if (pct >= 80) return '#03837b';
    if (pct >= 60) return '#3b82f6';
    return '#f97316';
  }

  /**
   * Infiere el perfil ideal de competencias (0–100 por dimensión)
   * a partir del título y descripción de la vacante.
   * (Replicado de vacante-nacional-detalle para calcular coincidencia en la lista.)
   */
  private inferirPerfilIdeal(puesto: string, descripcion: string): DimensionScores {
    const texto = (puesto + ' ' + descripcion).toLowerCase();

    let psi = 65, cog = 65, tec = 65, pro = 65;

    if (/developer|programador|software|frontend|backend|devops|qa|full.?stack|php|python|javascript|react|angular|nodejs|java |\.net|sistemas|computo|redes|infraestructura|soporte.?t[eé]cnico/.test(texto)) {
      tec = 88; cog = 82; psi = 58; pro = 65;
    } else if (/dato[s]?|data |analytics|analista|machine.?learning|bi |inteligencia.?artificial|estadis/.test(texto)) {
      cog = 90; tec = 82; psi = 60; pro = 70;
    } else if (/industrial|manufactura|calidad|producci[oó]n|mantenimiento|mecatr[oó]n|plc|automatizaci[oó]n|proceso/.test(texto)) {
      tec = 82; cog = 75; psi = 62; pro = 65;
    } else if (/contador|contabilidad|finanzas|auditor|impuesto|n[oó]mina|financiero|tesor/.test(texto)) {
      cog = 85; tec = 75; psi = 65; pro = 65;
    } else if (/log[ií]stica|almac[eé]n|inventario|cadena|transporte|distribuci[oó]n|operador/.test(texto)) {
      tec = 72; cog = 70; psi = 65; pro = 65;
    } else if (/recursos.?humanos|rrhh|reclutador|talento|capital.?humano|selecci[oó]n|orientador/.test(texto)) {
      psi = 88; pro = 78; cog = 68; tec = 55;
    } else if (/ventas|vendedor|comercial|asesor.?comercial|ejecutivo.?ventas/.test(texto)) {
      psi = 85; pro = 82; cog = 65; tec = 55;
    } else if (/marketing|publicidad|community|branding|redes.?sociales|seo|sem/.test(texto)) {
      pro = 82; psi = 78; cog = 68; tec = 60;
    } else if (/administrador|administrativo|coordinador|gerente|director/.test(texto)) {
      pro = 80; psi = 75; cog = 72; tec = 58;
    } else if (/enfermera|enfermero|salud|m[eé]dico|cl[ií]nica|hospital/.test(texto)) {
      psi = 80; cog = 75; tec = 72; pro = 65;
    } else if (/chef|cocinero|gastronom|alimentos|bebidas|rest aurante/.test(texto)) {
      tec = 78; psi = 72; cog = 65; pro = 68;
    } else if (/arquitecto|arquitectura|dise[ñn]o|revit|autocad|bim/.test(texto)) {
      tec = 80; cog = 75; pro = 72; psi = 60;
    } else if (/docente|maestro|profesor|educaci[oó]n|capacitaci[oó]n/.test(texto)) {
      psi = 82; cog = 78; pro = 72; tec = 60;
    }

    return { psicometrica: psi, cognitiva: cog, tecnica: tec, proyectiva: pro };
  }
}
