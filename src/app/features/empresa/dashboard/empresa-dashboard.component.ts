import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { SliderModule } from 'primeng/slider';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MessageService } from 'primeng/api';
import { EmpresaService } from '../../../core/services/empresa.service';
import { EgresadoService } from '../../../core/services/egresado.service';
import { AuthService } from '../../../core/services/auth.service';
import { ScoreCircleComponent } from '../../../shared/components/score-circle/score-circle.component';
import { SpiderChartComponent } from '../../../shared/components/spider-chart/spider-chart.component';
import { DimensionPillComponent } from '../../../shared/components/dimension-pill/dimension-pill.component';
import { CvPdfActionsComponent } from '../../../shared/components/cv-pdf-actions/cv-pdf-actions.component';
import { Empresa, Vacante, Egresado, Postulacion, DimensionType, egresadoNombreCompleto } from '../../../core/models';

interface CandidatoCard {
  egresado: Egresado;
  coincidencia: number;
  vacanteId?: string;
}

@Component({
  selector: 'app-empresa-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ButtonModule, DialogModule, DropdownModule, FormsModule, ToastModule, SliderModule, InputTextModule,
    ScoreCircleComponent, SpiderChartComponent, DimensionPillComponent, CvPdfActionsComponent
  ],
  providers: [MessageService],
  templateUrl: './empresa-dashboard.component.html',
  styleUrls: ['./empresa-dashboard.component.scss'],
})
export class EmpresaDashboardComponent implements OnInit {
  @ViewChild('logoInput') logoInput!: ElementRef<HTMLInputElement>;

  empresa?: Empresa;
  vacantes: Vacante[] = [];
  postulaciones: Postulacion[] = [];
  egresados: Egresado[] = [];
  candidatos: CandidatoCard[] = [];
  selectedVacanteId = '';
  loading = true;
  subiendoLogo = false;

  selectedCandidato?: CandidatoCard;
  showPerfilDialog = false;
  showDesempenoDialog = false;
  evaluandoDesempeno = false;
  selectedLaborando?: { postulacion: Postulacion; egresado: Egresado };
  evaluacionDesempeno = { calificacion: 10, comentario: '' };

  readonly DIMS: DimensionType[] = ['psicometrica', 'cognitiva', 'tecnica', 'proyectiva'];

  private empresaSvc  = inject(EmpresaService);
  private egresadoSvc = inject(EgresadoService);
  private authSvc     = inject(AuthService);
  private msgSvc      = inject(MessageService);

  get vacantesActivas()   { return this.vacantes.filter(v => v.activa).length; }
  get totalCandidatos()   { return this.candidatosIdoneos.length; }
  get totalContratados()  { return this.analiticaPorVacante.reduce((sum, row) => sum + row.aceptadas, 0); }
  get nombreEmpresa() { return this.empresa?.nombre ?? ''; }
  get empresaInicial() { return this.nombreEmpresa.trim()[0]?.toUpperCase() ?? 'E'; }
  get vacanteOpciones() { return this.vacantes.map(v => ({ label: v.puesto, value: v.id })); }

  get vacanteSeleccionada(): Vacante | undefined {
    return this.vacantes.find(v => v.id === this.selectedVacanteId) ?? this.vacantes[0];
  }

  get candidatosIdoneos(): CandidatoCard[] {
    const id = this.vacanteSeleccionada?.id;
    return this.candidatos
      .filter(c => !id || c.vacanteId === id)
      .filter(c => c.coincidencia >= 80)
      .sort((a, b) => b.coincidencia - a.coincidencia);
  }

  get postulacionesEmpresa(): Postulacion[] {
    const idsVacantes = new Set(this.vacantes.map(v => v.id));
    return this.postulaciones.filter(p => idsVacantes.has(p.vacante_id));
  }

  get postulacionesVacante(): Postulacion[] {
    const id = this.vacanteSeleccionada?.id;
    if (!id) return [];
    return this.postulacionesEmpresa.filter(p => p.vacante_id === id);
  }

  get analiticaVacante() {
    const postulaciones = this.postulacionesVacante;
    const promedio = postulaciones.length
      ? Math.round(postulaciones.reduce((sum, p) => sum + p.coincidencia, 0) / postulaciones.length)
      : 0;

    return {
      total: this.vacanteSeleccionada?.postulaciones_count ?? postulaciones.length,
      revision: postulaciones.filter(p => p.estatus === 'en_revision').length,
      entrevistas: postulaciones.filter(p => p.estatus === 'entrevista').length,
      contratados: this.vacanteSeleccionada?.contratados_count ?? postulaciones.filter(p => p.estatus === 'aceptada' || p.estatus === 'contratado').length,
      promedio,
    };
  }

  get analiticaPorVacante() {
    return this.vacantes.map(vacante => {
      const postulaciones = this.postulacionesEmpresa.filter(p => p.vacante_id === vacante.id);
      const promedio = postulaciones.length
        ? Math.round(postulaciones.reduce((sum, p) => sum + p.coincidencia, 0) / postulaciones.length)
        : 0;

      return {
        vacante,
        total: vacante.postulaciones_count ?? postulaciones.length,
        revision: postulaciones.filter(p => p.estatus === 'en_revision').length,
        entrevistas: postulaciones.filter(p => p.estatus === 'entrevista').length,
        aceptadas: vacante.contratados_count ?? postulaciones.filter(p => p.estatus === 'aceptada' || p.estatus === 'contratado').length,
        promedio,
        coberturaDias: vacante.cobertura_dias ?? 0,
      };
    });
  }

  get egresadosLaborando() {
    return this.postulacionesEmpresa
      .filter(p => p.estatus === 'aceptada' || p.estatus === 'contratado')
      .map(p => ({
        postulacion: p,
        egresado: this.egresados.find(eg => eg.id === p.egresado_id),
      }))
      .filter((r): r is { postulacion: Postulacion; egresado: Egresado } => !!r.egresado);
  }

  ngOnInit() {
    this.empresaSvc.getEmpresaActual().subscribe({
      next: empresa => {
        this.empresa = empresa;
        forkJoin({
          dashboard: this.empresaSvc.getDashboardEmpresa(empresa.id),
          egresados: this.egresadoSvc.getEgresados(),
        }).subscribe({
          next: ({ dashboard, egresados }) => {
            const egresadosById = new Map(egresados.map(e => [e.id, e]));
            this.egresados = egresados;
            this.vacantes = dashboard.vacantes;
            this.postulaciones = dashboard.postulaciones;
            this.candidatos = dashboard.candidatos.map(c => ({
              ...c,
              egresado: egresadosById.get(c.egresado.id) ?? c.egresado,
              vacanteId: c.vacanteId || (c.egresado.id ? this.postulaciones.find(p => p.egresado_id === c.egresado.id)?.vacante_id : undefined),
            }));
            this.selectedVacanteId = this.vacantes.find(v => v.activa)?.id ?? this.vacantes[0]?.id ?? '';
            this.loading = false;
          },
          error: () => this.loading = false,
        });
      },
      error: () => this.loading = false,
    });
  }

  verPerfilCompleto(candidato: CandidatoCard) {
    this.selectedCandidato = candidato;
    this.showPerfilDialog  = true;
  }

  triggerLogoUpload() { this.logoInput.nativeElement.click(); }

  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.empresa) return;

    const error = this.validarImagen(file);
    if (error) {
      this.msgSvc.add({ severity: 'warn', summary: 'Archivo invalido', detail: error });
      input.value = '';
      return;
    }

    this.subiendoLogo = true;
    this.empresaSvc.subirFoto(this.empresa.id, file).subscribe({
      next: updated => {
        const logoUrl = updated.logo_url ?? this.empresa?.logo_url;
        this.empresa = this.empresa ? { ...this.empresa, logo_url: logoUrl } : updated;
        this.authSvc.updateUsuario({ foto_url: logoUrl, logo_url: logoUrl });
        this.subiendoLogo = false;
        this.msgSvc.add({ severity: 'success', summary: 'Logo actualizado', detail: 'La imagen de empresa se subio a Drive correctamente.' });
      },
      error: (err: any) => {
        this.subiendoLogo = false;
        this.msgSvc.add({ severity: 'error', summary: 'Error', detail: err.message ?? 'No se pudo subir la imagen.' });
      }
    });
    input.value = '';
  }

  nombreCompleto(eg: Egresado): string { return egresadoNombreCompleto(eg); }

  abrirEvaluacionDesempeno(row: { postulacion: Postulacion; egresado: Egresado }) {
    this.selectedLaborando = row;
    this.evaluacionDesempeno = { calificacion: 10, comentario: '' };
    this.showDesempenoDialog = true;
  }

  enviarEvaluacionDesempeno() {
    if (!this.empresa || !this.selectedLaborando) return;
    const comentario = this.evaluacionDesempeno.comentario.trim();
    if (!comentario) {
      this.msgSvc.add({ severity: 'warn', summary: 'Comentario requerido', detail: 'Escribe un comentario de desempeño.' });
      return;
    }

    this.evaluandoDesempeno = true;
    this.empresaSvc.evaluarDesempeno({
      empresa_id: this.empresa.id,
      egresado_id: this.selectedLaborando.egresado.id,
      postulacion_id: this.selectedLaborando.postulacion.id,
      calificacion: this.evaluacionDesempeno.calificacion,
      comentario,
    }).subscribe({
      next: () => {
        this.evaluandoDesempeno = false;
        this.showDesempenoDialog = false;
        this.msgSvc.add({ severity: 'success', summary: 'Evaluación registrada', detail: 'El desempeño quedó registrado correctamente.' });
      },
      error: err => {
        this.evaluandoDesempeno = false;
        this.msgSvc.add({ severity: 'error', summary: 'No se pudo registrar', detail: err.message });
      }
    });
  }

  async exportarAnaliticaPDF() {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

    this.encabezadoPDF(doc, 'Analítica de Vacantes', fecha);

    // ── KPI summary boxes ──────────────────────────────────────────────────
    const kpis = [
      { label: 'Vacantes',      value: String(this.analiticaPorVacante.length),                                                                                                                                               color: [3, 131, 123]  as [number,number,number] },
      { label: 'Postulaciones', value: String(this.analiticaPorVacante.reduce((s, r) => s + r.total, 0)),                                                                                                                     color: [59, 130, 246] as [number,number,number] },
      { label: 'Contratados',   value: String(this.analiticaPorVacante.reduce((s, r) => s + r.aceptadas, 0)),                                                                                                                 color: [139, 92, 246] as [number,number,number] },
      { label: 'Match Prom.',   value: this.analiticaPorVacante.length ? `${Math.round(this.analiticaPorVacante.reduce((s, r) => s + r.promedio, 0) / this.analiticaPorVacante.length)}%` : '0%', color: [245, 158, 11] as [number,number,number] },
    ];

    const kpiGap = 4;
    const kpiW   = (pageW - 28 - kpiGap * 3) / 4;
    let kx = 14;
    kpis.forEach(kpi => {
      const [r, g, b] = kpi.color;
      doc.setFillColor(r, g, b);
      doc.roundedRect(kx, 46, kpiW, 22, 3, 3, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont('helvetica', 'bold');
      doc.text(kpi.value, kx + kpiW / 2, 54.5, { align: 'center' });
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.text(kpi.label.toUpperCase(), kx + kpiW / 2, 63, { align: 'center' });
      kx += kpiW + kpiGap;
    });

    // ── Table header ───────────────────────────────────────────────────────
    // Columns: Puesto(14-75) | Estado(77-98) | Postul.(100-124) | Revisión(126-148) | Contrat.(150-170) | Match(172-196)
    const drawTableHeader = (topY: number) => {
      doc.setFillColor(3, 131, 123);
      doc.rect(14, topY, pageW - 28, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('Puesto / Vacante', 17,          topY + 6);
      doc.text('Estado',           79,           topY + 6);
      doc.text('Postulaciones',    101,          topY + 6);
      doc.text('Revisión',         127,          topY + 6);
      doc.text('Contratados',      151,          topY + 6);
      doc.text('Match',            176,          topY + 6);
    };

    drawTableHeader(78);
    let y   = 87;
    const rowH = 10;

    this.analiticaPorVacante.forEach((row, idx) => {
      if (y + rowH > pageH - 20) {
        this.pieDePagePDF(doc, fecha, pageW, pageH);
        doc.addPage();
        this.encabezadoPDF(doc, 'Analítica de Vacantes', fecha);
        drawTableHeader(46);
        y = 55;
      }

      // Alternating row background
      if (idx % 2 === 0) {
        doc.setFillColor(240, 253, 252);
        doc.rect(14, y, pageW - 28, rowH, 'F');
      }
      // Left accent
      doc.setFillColor(3, 131, 123);
      doc.rect(14, y, 3, rowH, 'F');

      const cy = y + rowH / 2 + 1.5;

      // Puesto
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(row.vacante.puesto.slice(0, 28), 19, cy);

      // Estado
      const [er, eg, eb] = row.vacante.activa ? [16, 185, 129] as [number,number,number] : [107, 114, 128] as [number,number,number];
      doc.setTextColor(er, eg, eb);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(row.vacante.activa ? 'Activa' : 'Inactiva', 79, cy);

      // Postulaciones / Revisión / Contratados (centered in their col)
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.text(String(row.total),    113, cy, { align: 'center' });
      doc.text(String(row.revision), 137, cy, { align: 'center' });
      doc.text(String(row.aceptadas),162, cy, { align: 'center' });

      // Match badge
      const [mr, mg, mb] = row.promedio >= 80 ? [16, 185, 129]  as [number,number,number]
                         : row.promedio >= 60 ? [245, 158, 11]  as [number,number,number]
                                              : [239, 68,  68]  as [number,number,number];
      doc.setFillColor(mr, mg, mb);
      doc.roundedRect(174, y + 2.5, 18, 5.5, 1.5, 1.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(`${row.promedio}%`, 183, y + 6.5, { align: 'center' });

      // Separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(14, y + rowH, pageW - 14, y + rowH);

      y += rowH;
    });

    if (this.analiticaPorVacante.length === 0) {
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('Sin vacantes registradas aún.', pageW / 2, y + 20, { align: 'center' });
    }

    this.pieDePagePDF(doc, fecha, pageW, pageH);
    doc.save(`analitica-vacantes-${this.nombreEmpresa.replace(/\s+/g, '-')}.pdf`);
  }

  async exportarPlantillaPDF() {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const fecha = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

    // Helper: clean raw timestamp → YYYY-MM-DD
    const fechaCorta = (raw: string) => (raw ?? '').split('T')[0].split(' ')[0];

    this.encabezadoPDF(doc, 'Reporte de Plantilla', fecha);

    // ── Summary banner ──────────────────────────────────────────────────────
    doc.setFillColor(3, 131, 123);
    doc.roundedRect(14, 46, pageW - 28, 22, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(String(this.egresadosLaborando.length), pageW / 2, 55, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('EGRESADOS UTC INCORPORADOS A LA PLANTILLA', pageW / 2, 63, { align: 'center' });

    // ── Table ───────────────────────────────────────────────────────────────
    // Col layout (avatar block 14-28, name 28-82, carrera 84-135, puesto 137-170, ingreso 172-196)
    const drawTableHeader = (topY: number) => {
      doc.setFillColor(3, 131, 123);
      doc.rect(14, topY, pageW - 28, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text('Egresado', 30,  topY + 6);
      doc.text('Carrera',  86,  topY + 6);
      doc.text('Puesto',   139, topY + 6);
      doc.text('Ingreso',  173, topY + 6);
    };

    drawTableHeader(78);
    let y = 87;
    const rowH = 13;

    this.egresadosLaborando.forEach((row, idx) => {
      if (y + rowH > pageH - 20) {
        this.pieDePagePDF(doc, fecha, pageW, pageH);
        doc.addPage();
        this.encabezadoPDF(doc, 'Reporte de Plantilla', fecha);
        drawTableHeader(46);
        y = 55;
      }

      // Row background
      if (idx % 2 === 0) {
        doc.setFillColor(240, 253, 252);
        doc.rect(14, y, pageW - 28, rowH, 'F');
      }

      // Avatar circle — strictly within the left 14px gutter
      const avatarCX = 21;
      const avatarCY = y + rowH / 2;
      doc.setFillColor(3, 131, 123);
      doc.circle(avatarCX, avatarCY, 4.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      const initials = `${row.egresado.nombre[0] ?? ''}${row.egresado.apellido_paterno[0] ?? ''}`;
      doc.text(initials, avatarCX, avatarCY + 2, { align: 'center' });

      // Egresado name + email — starts after avatar (x=28)
      const textX = 29;
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(this.nombreCompleto(row.egresado).slice(0, 24), textX, y + 5.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text((row.egresado.email ?? '').slice(0, 26), textX, y + 11);

      // Carrera
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7);
      doc.text((row.egresado.carrera ?? '').slice(0, 24), 86, y + rowH / 2 + 2);

      // Puesto
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.text(row.postulacion.puesto.slice(0, 18), 139, y + rowH / 2 + 2);

      // Ingreso — clean date
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text(fechaCorta(row.postulacion.fecha_postulacion), 173, y + rowH / 2 + 2);

      // Row separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(14, y + rowH, pageW - 14, y + rowH);

      y += rowH;
    });

    if (this.egresadosLaborando.length === 0) {
      doc.setTextColor(107, 114, 128);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('Sin contrataciones registradas aún.', pageW / 2, y + 20, { align: 'center' });
    }

    this.pieDePagePDF(doc, fecha, pageW, pageH);
    doc.save(`plantilla-${this.nombreEmpresa.replace(/\s+/g, '-')}.pdf`);
  }

  private encabezadoPDF(doc: any, titulo: string, fecha: string) {
    const pageW = doc.internal.pageSize.getWidth();

    // Top color band
    doc.setFillColor(3, 131, 123);
    doc.rect(0, 0, pageW, 10, 'F');

    // Logo block
    doc.setFillColor(2, 78, 74);
    doc.roundedRect(14, 14, 18, 18, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('VX', 23, 25, { align: 'center' });

    // Title block
    doc.setTextColor(3, 61, 60);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Bolsa de Trabajo UTC', 36, 21);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(titulo, 36, 28);

    // Company + date on the right
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(this.nombreEmpresa, pageW - 14, 21, { align: 'right' });
    doc.text(fecha, pageW - 14, 28, { align: 'right' });

    // Separator line
    doc.setDrawColor(3, 131, 123);
    doc.setLineWidth(0.6);
    doc.line(14, 36, pageW - 14, 36);

    doc.setTextColor(15, 23, 42);
  }

  private pieDePagePDF(doc: any, fecha: string, pageW: number, pageH: number) {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, pageH - 14, pageW - 14, pageH - 14);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.text('Universidad Tecnológica de la Costa · Bolsa de Trabajo VitaEx', 14, pageH - 8);
    doc.text(`Generado el ${fecha}`, pageW - 14, pageH - 8, { align: 'right' });
  }

  private validarImagen(file: File): string | null {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && !['jpg', 'jpeg', 'png', 'webp'].includes(extension)) return 'La imagen debe ser JPG, PNG o WEBP.';
    if (file.size > 15 * 1024 * 1024) return 'El archivo no debe superar los 15 MB.';
    return null;
  }
}
