import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { SliderModule } from 'primeng/slider';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { EmpresaService } from '../../../core/services/empresa.service';
import { DimensionPillComponent } from '../../../shared/components/dimension-pill/dimension-pill.component';
import { Empresa, Vacante, DimensionType, DimensionScores } from '../../../core/models';

@Component({
  selector: 'app-empresa-vacantes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    ButtonModule, TableModule, DialogModule,
    InputTextModule, InputTextareaModule, DropdownModule, SliderModule, TagModule, ToastModule,
    DimensionPillComponent,
  ],
  providers: [MessageService],
  templateUrl: './empresa-vacantes.component.html',
  styleUrls: ['./empresa-vacantes.component.scss'],
})
export class EmpresaVacantesComponent implements OnInit {
  vacantes: Vacante[] = [];
  empresaActual?: Empresa;
  loading      = true;
  showDialog   = false;
  saving       = false;
  editingVacante?: Vacante;

  form!: FormGroup;

  perfilIdeal: DimensionScores = { psicometrica: 70, cognitiva: 75, tecnica: 80, proyectiva: 65 };

  readonly DIMS: DimensionType[] = ['psicometrica', 'cognitiva', 'tecnica', 'proyectiva'];

  readonly modalidadOpciones = [
    { label: 'Presencial', value: 'presencial' },
    { label: 'Remoto',     value: 'remoto' },
    { label: 'Híbrido',    value: 'hibrido' },
  ];

  private readonly camposRequeridos: Record<string, string> = {
    puesto: 'puesto',
    area: 'área',
    descripcion: 'descripción',
    ubicacion: 'ubicación',
    modalidad: 'modalidad',
  };

  private empresaSvc = inject(EmpresaService);
  private fb         = inject(FormBuilder);
  private msgSvc     = inject(MessageService);

  ngOnInit() {
    this.buildForm();
    this.empresaSvc.getEmpresaActual().subscribe(e => {
      this.empresaActual = e;
      this.empresaSvc.getVacantesEmpresa(e.id).subscribe(vacs => {
        this.vacantes = vacs;
        this.loading  = false;
      });
    });
  }

  buildForm() {
    this.form = this.fb.group({
      puesto:      ['', [Validators.required, Validators.pattern(/\S/)]],
      descripcion: ['', [Validators.required, Validators.pattern(/\S/)]],
      area:        ['', [Validators.required, Validators.pattern(/\S/)]],
      ubicacion:   ['', [Validators.required, Validators.pattern(/\S/)]],
      modalidad:   ['presencial', Validators.required],
      salario_rango: [''],
    });
  }

  abrirDialogo() {
    this.buildForm();
    this.editingVacante = undefined;
    this.perfilIdeal = { psicometrica: 70, cognitiva: 75, tecnica: 80, proyectiva: 65 };
    this.showDialog  = true;
  }

  abrirEdicion(vacante: Vacante) {
    this.editingVacante = vacante;
    this.buildForm();
    this.form.patchValue({
      puesto: vacante.puesto,
      descripcion: vacante.descripcion,
      area: vacante.area,
      ubicacion: vacante.ubicacion,
      modalidad: vacante.modalidad,
      salario_rango: vacante.salario_rango ?? '',
    });
    this.perfilIdeal = { ...vacante.perfil_ideal };
    this.showDialog = true;
  }

  cancelarDialogo() {
    this.showDialog = false;
    this.editingVacante = undefined;
  }

  guardarVacante() {
    this.form.patchValue(this.normalizarValoresTexto());

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const primerCampo = this.primerCampoInvalido();
      this.msgSvc.add({
        severity: 'warn',
        summary: 'Faltan datos de la vacante',
        detail: primerCampo
          ? `Falta llenar el campo ${this.camposRequeridos[primerCampo]}.`
          : 'Revisa los campos marcados antes de continuar.',
      });
      return;
    }

    this.saving = true;

    const payload: Partial<Vacante> = {
      ...this.form.value,
      perfil_ideal: this.perfilIdeal,
    };

    if (this.editingVacante) {
      this.empresaSvc.actualizarVacante(this.editingVacante.id, payload).subscribe(v => {
        this.vacantes = this.vacantes.map(item => item.id === v.id ? v : item);
        this.saving = false;
        this.showDialog = false;
        this.editingVacante = undefined;
        this.msgSvc.add({ severity: 'success', summary: 'Vacante actualizada', detail: `"${v.puesto}" se guardó correctamente.` });
      });
      return;
    }

    const empresa = this.empresaActual;
    const nueva: Partial<Vacante> = {
      ...payload,
      empresa_id: empresa?.id ?? 'e1',
      empresa_nombre: empresa?.nombre ?? 'TecnoSol del Pacífico',
      zona_norte: empresa?.zona === 'norte',
      activa: true,
      fecha_publicacion: new Date().toISOString().split('T')[0],
    };

    this.empresaSvc.crearVacante(nueva).subscribe(v => {
      this.vacantes = [v, ...this.vacantes];
      this.saving = false;
      this.showDialog = false;
      this.msgSvc.add({ severity: 'success', summary: 'Vacante creada', detail: `"${v.puesto}" publicada exitosamente.` });
    });
  }

  darBajaVacante(vacante: Vacante) {
    if (!vacante.activa) return;
    this.empresaSvc.darBajaVacante(vacante.id).subscribe(v => {
      this.vacantes = this.vacantes.map(item => item.id === v.id ? v : item);
      this.msgSvc.add({ severity: 'info', summary: 'Vacante dada de baja', detail: `"${v.puesto}" ya no está activa.` });
    });
  }

  reactivarVacante(vacante: Vacante) {
    if (vacante.activa) return;
    this.empresaSvc.actualizarVacante(vacante.id, { activa: true }).subscribe(v => {
      this.vacantes = this.vacantes.map(item => item.id === v.id ? v : item);
      this.msgSvc.add({ severity: 'success', summary: 'Vacante reactivada', detail: `"${v.puesto}" vuelve a estar activa.` });
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.form.get(campo);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  mensajeCampo(campo: string): string {
    return `Falta llenar ${this.camposRequeridos[campo] ?? 'este campo'}.`;
  }

  private primerCampoInvalido(): string | undefined {
    return Object.keys(this.camposRequeridos).find(campo => this.form.get(campo)?.invalid);
  }

  private normalizarValoresTexto() {
    return {
      puesto: this.form.value.puesto?.trim() ?? '',
      descripcion: this.form.value.descripcion?.trim() ?? '',
      area: this.form.value.area?.trim() ?? '',
      ubicacion: this.form.value.ubicacion?.trim() ?? '',
      salario_rango: this.form.value.salario_rango?.trim() ?? '',
    };
  }
}
