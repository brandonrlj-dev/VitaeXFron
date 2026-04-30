import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { EgresadoService } from '../../../core/services/egresado.service';
import { ProfilePhotoService } from '../../../core/services/profile-photo.service';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { DialogModule } from 'primeng/dialog';
import { Egresado, Educacion, egresadoNombreCompleto } from '../../../core/models';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule, 
    ToastModule, TooltipModule, DialogModule, InputTextareaModule
  ],
  providers: [MessageService],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent implements OnInit {
  @ViewChild('fotoInput') fotoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('certInput') certInput!: ElementRef<HTMLInputElement>;

  egresado?: Egresado;
  loading     = true;
  cvUrl       = '';
  savingCv    = false;
  savingCertificado = false;
  uploadingFoto = false;
  fotoError   = '';
  dragOver    = false;

  // Modal Trayectoria
  displayTrayectoriaModal = false;
  editEducacion: Educacion = { institucion: '', grado: '', periodo: '', descripcion: '' };
  editIndex = -1;

  private svc          = inject(EgresadoService);
  private photoService = inject(ProfilePhotoService);
  private msgSvc       = inject(MessageService);

  get nombreCompleto() { return this.egresado ? egresadoNombreCompleto(this.egresado) : ''; }
  get fotoUrl(): string | null { return this.photoService.fotoEgresado(); }
  get tieneFoto(): boolean { return !!this.photoService.fotoEgresado(); }

  ngOnInit() {
    this.svc.getEgresadoActual().subscribe(e => {
      this.egresado = e;
      this.cvUrl    = e.cv_url ?? '';
      this.loading  = false;
    });
  }

  // ─── Foto ──────────────────────────────────────────────────────────────────
  triggerFotoUpload() { this.fotoInput.nativeElement.click(); }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragOver = true;
  }

  onDragLeave() { this.dragOver = false; }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.procesarFoto(file);
  }

  async onFotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (file) await this.procesarFoto(file);
    input.value = '';
  }

  private async procesarFoto(file: File) {
    this.fotoError    = '';
    this.uploadingFoto = true;
    try {
      const dataUrl = await this.photoService.readFile(file);
      this.photoService.setFotoEgresado(dataUrl);
      this.msgSvc.add({ severity: 'success', summary: 'Foto guardada', detail: 'Tu foto de perfil se actualizó correctamente.' });
    } catch (err: any) {
      this.fotoError = err.message;
      this.msgSvc.add({ severity: 'error', summary: 'Error al subir', detail: err.message });
    } finally {
      this.uploadingFoto = false;
    }
  }

  eliminarFoto() {
    this.photoService.removeFotoEgresado();
    this.msgSvc.add({ severity: 'info', summary: 'Foto eliminada', detail: 'Deberás subir una nueva foto para postularte a vacantes.' });
  }

  // ─── CV ────────────────────────────────────────────────────────────────────
  guardarCV() {
    if (!this.cvUrl.startsWith('http')) {
      this.msgSvc.add({ severity: 'warn', summary: 'URL inválida', detail: 'Ingresa un enlace válido de Google Drive.' });
      return;
    }
    this.savingCv = true;
    this.svc.subirCV(this.egresado!.id, this.cvUrl).subscribe(() => {
      this.savingCv = false;
      this.msgSvc.add({ severity: 'success', summary: 'CV actualizado', detail: 'Tu CV ha sido guardado correctamente.' });
    });
  }

  // ─── Certificados ─────────────────────────────────────────────────────────
  triggerCertificadoUpload() { this.certInput.nativeElement.click(); }

  async onCertificadoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    if (this.egresado && this.egresado.certificados.length >= 5) {
      this.msgSvc.add({ severity: 'warn', summary: 'Límite alcanzado', detail: 'Solo puedes subir un máximo de 5 documentos.' });
      input.value = '';
      return;
    }

    this.savingCertificado = true;
    this.svc.subirCertificado(this.egresado!.id, file).subscribe({
      next: (res: any) => {
        this.savingCertificado = false;
        if (this.egresado) {
          this.egresado.certificados.push({
            nombre: file.name,
            url: res.url || 'mock_url.pdf'
          });
        }
        this.msgSvc.add({ severity: 'success', summary: 'Documento añadido', detail: 'El archivo se ha cargado correctamente.' });
      },
      error: () => {
        this.savingCertificado = false;
        this.msgSvc.add({ severity: 'error', summary: 'Error', detail: 'No se pudo subir el archivo.' });
      }
    });
    input.value = '';
  }

  eliminarCertificado(index: number) {
    const cert = this.egresado!.certificados[index];
    this.svc.eliminarCertificado(this.egresado!.id, cert.url).subscribe(() => {
      this.egresado!.certificados.splice(index, 1);
      this.msgSvc.add({ severity: 'info', summary: 'Documento eliminado', detail: 'El archivo ha sido removido.' });
    });
  }

  // ─── Trayectoria ───────────────────────────────────────────────────────────
  abrirModalTrayectoria(entry?: Educacion, index: number = -1) {
    if (entry) {
      this.editEducacion = { ...entry };
      this.editIndex = index;
    } else {
      this.editEducacion = { institucion: '', grado: '', periodo: '', descripcion: '' };
      this.editIndex = -1;
    }
    this.displayTrayectoriaModal = true;
  }

  guardarTrayectoria() {
    if (!this.egresado) return;
    if (!this.editEducacion.institucion || !this.editEducacion.grado) {
      this.msgSvc.add({ severity: 'warn', summary: 'Campos incompletos', detail: 'La institución y el grado son obligatorios.' });
      return;
    }

    if (this.editIndex > -1) {
      this.egresado.trayectoria[this.editIndex] = { ...this.editEducacion };
    } else {
      this.egresado.trayectoria.push({ ...this.editEducacion });
    }
    this.displayTrayectoriaModal = false;
    this.msgSvc.add({ severity: 'success', summary: 'Actualizado', detail: 'Tu trayectoria académica ha sido actualizada.' });
  }

  eliminarTrayectoria(index: number) {
    if (confirm('¿Estás seguro de eliminar este registro académico?')) {
      this.egresado?.trayectoria.splice(index, 1);
      this.msgSvc.add({ severity: 'info', summary: 'Eliminado', detail: 'Registro eliminado correctamente.' });
    }
  }
}
