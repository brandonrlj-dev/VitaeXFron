import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextModule as TextareaModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { SliderModule } from 'primeng/slider';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { EmpresaService } from '../../../core/services/empresa.service';
import { DimensionPillComponent } from '../../../shared/components/dimension-pill/dimension-pill.component';
import { Vacante, DimensionType, DimensionScores } from '../../../core/models';

@Component({
  selector: 'app-empresa-vacantes',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    ButtonModule, TableModule, DialogModule,
    InputTextModule, TextareaModule, DropdownModule, SliderModule, TagModule, ToastModule,
    DimensionPillComponent,
  ],
  providers: [MessageService],
  templateUrl: './empresa-vacantes.component.html',
  styleUrls: ['./empresa-vacantes.component.scss'],
})
export class EmpresaVacantesComponent implements OnInit {
  vacantes: Vacante[] = [];
  loading      = true;
  showDialog   = false;
  saving       = false;

  form!: FormGroup;

  perfilIdeal: DimensionScores = { psicometrica: 70, cognitiva: 75, tecnica: 80, proyectiva: 65 };

  readonly DIMS: DimensionType[] = ['psicometrica', 'cognitiva', 'tecnica', 'proyectiva'];

  readonly modalidadOpciones = [
    { label: 'Presencial', value: 'presencial' },
    { label: 'Remoto',     value: 'remoto' },
    { label: 'Híbrido',    value: 'hibrido' },
  ];

  private empresaSvc = inject(EmpresaService);
  private fb         = inject(FormBuilder);
  private msgSvc     = inject(MessageService);

  ngOnInit() {
    this.buildForm();
    this.empresaSvc.getEmpresaActual().subscribe(e => {
      this.empresaSvc.getVacantesEmpresa(e.id).subscribe(vacs => {
        this.vacantes = vacs;
        this.loading  = false;
      });
    });
  }

  buildForm() {
    this.form = this.fb.group({
      puesto:      ['', Validators.required],
      descripcion: ['', Validators.required],
      area:        ['', Validators.required],
      ubicacion:   ['', Validators.required],
      modalidad:   ['presencial', Validators.required],
      salario_rango: [''],
    });
  }

  abrirDialogo() {
    this.buildForm();
    this.perfilIdeal = { psicometrica: 70, cognitiva: 75, tecnica: 80, proyectiva: 65 };
    this.showDialog  = true;
  }

  guardarVacante() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;

    const nueva: Partial<Vacante> = {
      ...this.form.value,
      empresa_id: 'e1',
      empresa_nombre: 'TecnoSol del Pacífico',
      perfil_ideal: this.perfilIdeal,
      zona_norte: true,
      activa: true,
      fecha_publicacion: new Date().toISOString().split('T')[0],
    };

    this.empresaSvc.crearVacante(nueva).subscribe(v => {
      this.vacantes = [v, ...this.vacantes];
      this.saving    = false;
      this.showDialog = false;
      this.msgSvc.add({ severity: 'success', summary: 'Vacante creada', detail: `"${v.puesto}" publicada exitosamente.` });
    });
  }
}
