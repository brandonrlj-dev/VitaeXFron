import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { EgresadoService } from '../../../core/services/egresado.service';
import { Educacion, Egresado, ExperienciaLaboral, egresadoNombreCompleto } from '../../../core/models';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, DialogModule, InputTextModule,
    ToastModule, TooltipModule,
  ],
  providers: [MessageService],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent implements OnInit {
  @ViewChild('fotoInput') fotoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('cvInput')   cvInput!:   ElementRef<HTMLInputElement>;
  @ViewChild('certInput') certInput!: ElementRef<HTMLInputElement>;

  // ─── Estado general ────────────────────────────────────────────────────────
  egresado?: Egresado;
  loading           = true;
  savingCv          = false;
  savingCertificado = false;
  uploadingFoto     = false;
  fotoError         = '';
  dragOver          = false;

  // ─── Trayectoria académica ─────────────────────────────────────────────────
  savingTrayectoria          = false;
  displayTrayectoriaModal    = false;
  editIndex                  = -1;
  editEducacion: Educacion   = { institucion: '', grado: '', periodo: '' };

  // ─── Experiencia laboral ───────────────────────────────────────────────────
  displayExpModal                  = false;
  editExpIndex                     = -1;
  editExp: ExperienciaLaboral      = { empresa: '', puesto: '', fecha_inicio: '', trabajo_actual: true };
  experienciaLaboral: ExperienciaLaboral[] = [];

  private svc     = inject(EgresadoService);
  private authSvc = inject(AuthService);
  private msgSvc  = inject(MessageService);

  get nombreCompleto(): string { return this.egresado ? egresadoNombreCompleto(this.egresado) : ''; }
  get fotoUrl(): string | null  { return this.egresado?.foto_url ?? null; }
  get tieneFoto(): boolean      { return !!this.egresado?.foto_url; }

  ngOnInit(): void {
    this.svc.getEgresadoActual().subscribe(e => {
      this.egresado = { ...e, trayectoria: [] };
      this.loading  = false;
      this.svc.getTrayectoria(e.id).subscribe(t => {
        this.egresado!.trayectoria = t;
      });
    });
  }

  // ─── Foto ──────────────────────────────────────────────────────────────────
  triggerFotoUpload(): void { this.fotoInput.nativeElement.click(); }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.dragOver = true; }
  onDragLeave(): void { this.dragOver = false; }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.procesarFoto(file);
  }

  onFotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (file) this.procesarFoto(file);
    input.value = '';
  }

  private procesarFoto(file: File): void {
    this.fotoError    = '';
    this.uploadingFoto = true;
    const error = this.validarArchivo(file, ['image/jpeg','image/png','image/webp'], ['jpg','jpeg','png','webp'], 'La foto debe ser JPG, PNG o WEBP.');
    if (error) {
      this.fotoError    = error;
      this.uploadingFoto = false;
      this.msgSvc.add({ severity: 'error', summary: 'Archivo inválido', detail: error });
      return;
    }
    this.svc.subirFoto(this.egresado!.id, file).subscribe({
      next: updated => {
        const fotoUrl = updated.foto_url ?? this.egresado?.foto_url;
        this.egresado = this.egresado ? { ...this.egresado, foto_url: fotoUrl } : updated;
        this.authSvc.updateUsuario({ foto_url: fotoUrl });
        this.uploadingFoto = false;
        this.msgSvc.add({ severity: 'success', summary: 'Foto guardada', detail: 'Tu foto de perfil se subió a Drive correctamente.' });
      },
      error: (err: any) => {
        this.fotoError    = err.message ?? 'No se pudo subir la foto.';
        this.uploadingFoto = false;
        this.msgSvc.add({ severity: 'error', summary: 'Error al subir', detail: this.fotoError });
      }
    });
  }

  // ─── CV ────────────────────────────────────────────────────────────────────
  triggerCvUpload(): void { this.cvInput.nativeElement.click(); }

  onCvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (file) this.guardarCV(file);
    input.value = '';
  }

  guardarCV(file: File): void {
    const error = this.validarArchivo(
      file,
      ['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      ['pdf','doc','docx'],
      'El CV debe ser PDF, DOC o DOCX.'
    );
    if (error) { this.msgSvc.add({ severity: 'warn', summary: 'Archivo inválido', detail: error }); return; }

    this.savingCv = true;
    this.svc.subirCV(this.egresado!.id, file).subscribe({
      next: updated => {
        const cvUrl = updated.cv_url ?? this.egresado?.cv_url;
        this.egresado = this.egresado ? { ...this.egresado, cv_url: cvUrl } : updated;
        this.authSvc.updateUsuario({ cv_url: cvUrl });
        this.savingCv = false;
        this.msgSvc.add({ severity: 'success', summary: 'CV actualizado', detail: 'Tu CV se subió a Drive correctamente.' });
      },
      error: (err: any) => {
        this.savingCv = false;
        this.msgSvc.add({ severity: 'error', summary: 'Error', detail: err.message ?? 'No se pudo subir el CV.' });
      }
    });
  }

  // ─── Certificados ──────────────────────────────────────────────────────────
  triggerCertificadoUpload(): void { this.certInput.nativeElement.click(); }

  onCertificadoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    const error = this.validarArchivo(file, ['application/pdf','image/jpeg','image/png','image/webp'], ['pdf','jpg','jpeg','png','webp'], 'El documento debe ser PDF, JPG, PNG o WEBP.');
    if (error) { this.msgSvc.add({ severity: 'warn', summary: 'Archivo inválido', detail: error }); input.value = ''; return; }

    if (this.egresado && this.egresado.certificados.length >= 5) {
      this.msgSvc.add({ severity: 'warn', summary: 'Límite alcanzado', detail: 'Solo puedes subir un máximo de 5 documentos.' });
      input.value = '';
      return;
    }

    this.savingCertificado = true;
    this.svc.subirCertificado(this.egresado!.id, file).subscribe({
      next: (res: any) => {
        this.savingCertificado = false;
        this.egresado?.certificados.push({ id: res.id, nombre: res.nombre || file.name, url: res.url || res.url_documento || '' });
        this.msgSvc.add({ severity: 'success', summary: 'Documento añadido', detail: 'El archivo se subió a Drive correctamente.' });
      },
      error: (err: any) => {
        this.savingCertificado = false;
        this.msgSvc.add({ severity: 'error', summary: 'Error', detail: err.message ?? 'No se pudo subir el archivo.' });
      }
    });
    input.value = '';
  }

  eliminarCertificado(index: number): void {
    const cert = this.egresado!.certificados[index];
    this.svc.eliminarCertificado(this.egresado!.id, cert.id ?? cert.url).subscribe(() => {
      this.egresado!.certificados.splice(index, 1);
      this.msgSvc.add({ severity: 'info', summary: 'Documento eliminado', detail: 'El archivo ha sido removido.' });
    });
  }

  // ─── Trayectoria académica ─────────────────────────────────────────────────
  abrirModalTrayectoria(entry?: Educacion, index = -1): void {
    this.editEducacion = entry ? { ...entry } : { institucion: '', grado: '', periodo: '' };
    this.editIndex     = index;
    this.displayTrayectoriaModal = true;
  }

  guardarTrayectoria(): void {
    if (!this.egresado) return;
    if (!this.editEducacion.institucion || !this.editEducacion.grado) {
      this.msgSvc.add({ severity: 'warn', summary: 'Campos incompletos', detail: 'La institución y el grado son obligatorios.' });
      return;
    }
    this.savingTrayectoria = true;
    const item = { ...this.editEducacion };

    if (this.editIndex > -1 && item.id) {
      this.svc.actualizarTrayectoria(item.id, item).subscribe({
        next: updated => {
          this.egresado!.trayectoria[this.editIndex] = updated;
          this.savingTrayectoria       = false;
          this.displayTrayectoriaModal = false;
          this.msgSvc.add({ severity: 'success', summary: 'Actualizado', detail: 'Trayectoria actualizada.' });
        },
        error: () => { this.savingTrayectoria = false; }
      });
    } else {
      this.svc.crearTrayectoria(this.egresado.id, item).subscribe({
        next: created => {
          this.egresado!.trayectoria.push(created);
          this.savingTrayectoria       = false;
          this.displayTrayectoriaModal = false;
          this.msgSvc.add({ severity: 'success', summary: 'Guardado', detail: 'Registro académico añadido.' });
        },
        error: () => { this.savingTrayectoria = false; }
      });
    }
  }

  eliminarTrayectoria(index: number): void {
    const item = this.egresado!.trayectoria[index];
    if (!confirm('¿Eliminar este registro académico?')) return;
    if (item.id) {
      this.svc.eliminarTrayectoria(item.id).subscribe(() => {
        this.egresado!.trayectoria.splice(index, 1);
        this.msgSvc.add({ severity: 'info', summary: 'Eliminado', detail: 'Registro eliminado.' });
      });
    } else {
      this.egresado!.trayectoria.splice(index, 1);
    }
  }

  // ─── Experiencia laboral ───────────────────────────────────────────────────
  abrirModalExp(entry?: ExperienciaLaboral, index = -1): void {
    this.editExp      = entry ? { ...entry } : { empresa: '', puesto: '', fecha_inicio: '', trabajo_actual: true };
    this.editExpIndex = index;
    this.displayExpModal = true;
  }

  guardarExp(): void {
    if (!this.editExp.empresa || !this.editExp.puesto || !this.editExp.fecha_inicio) {
      this.msgSvc.add({ severity: 'warn', summary: 'Campos incompletos', detail: 'Empresa, puesto y fecha de inicio son obligatorios.' });
      return;
    }
    if (this.editExp.trabajo_actual) this.editExp.fecha_fin = undefined;
    if (this.editExpIndex > -1) {
      this.experienciaLaboral[this.editExpIndex] = { ...this.editExp };
    } else {
      this.experienciaLaboral.push({ ...this.editExp });
    }
    this.displayExpModal = false;
    this.msgSvc.add({ severity: 'success', summary: 'Guardado', detail: 'Experiencia actualizada.' });
  }

  eliminarExp(index: number): void {
    if (confirm('¿Eliminar esta experiencia?')) this.experienciaLaboral.splice(index, 1);
  }

  // ─── Utilidades ────────────────────────────────────────────────────────────
  private validarArchivo(file: File, allowedTypes: string[], allowedExtensions: string[], message: string): string | null {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(ext)) return message;
    if (file.size > 15 * 1024 * 1024) return 'El archivo no debe superar los 15 MB.';
    return null;
  }
}
