import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EgresadoService } from '../../../core/services/egresado.service';
import { AuthService } from '../../../core/services/auth.service';
import { Egresado, Educacion, egresadoNombreCompleto } from '../../../core/models';
import { buildEgresadoPhotoUrl, usablePhotoUrl } from '../../../core/services/profile-photo.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, InputTextModule,
    ToastModule, TooltipModule, DialogModule, ConfirmDialogModule
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent implements OnInit {
  @ViewChild('fotoInput') fotoInput!: ElementRef<HTMLInputElement>;
  @ViewChild('cvInput') cvInput!: ElementRef<HTMLInputElement>;
  @ViewChild('certInput') certInput!: ElementRef<HTMLInputElement>;

  egresado?: Egresado;
  loading = true;
  savingCv = false;
  savingCertificado = false;
  uploadingFoto = false;
  fotoError = '';
  dragOver = false;

  displayTrayectoriaModal = false;
  editEducacion: Educacion = { institucion: '', grado: '', periodo: '', descripcion: '' };
  editIndex = -1;

  private svc = inject(EgresadoService);
  private authSvc = inject(AuthService);
  private msgSvc = inject(MessageService);
  private confirmSvc = inject(ConfirmationService);

  get nombreCompleto() { return this.egresado ? egresadoNombreCompleto(this.egresado) : ''; }
  get fotoUrl(): string | null { return buildEgresadoPhotoUrl(this.egresado?.id, this.egresado?.foto_url); }
  get tieneFoto(): boolean { return !!usablePhotoUrl(this.egresado?.foto_url); }

  ngOnInit() {
    this.svc.getEgresadoActual().subscribe((e: Egresado) => {
      this.egresado = e;
      this.loading = false;
    });
  }

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

  onFotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.procesarFoto(file);
    input.value = '';
  }

  private procesarFoto(file: File) {
    this.fotoError = '';
    this.uploadingFoto = true;
    const error = this.validarArchivo(file, ['image/jpeg', 'image/png', 'image/webp'], ['jpg', 'jpeg', 'png', 'webp'], 'La foto debe ser JPG, PNG o WEBP.');
    if (error) {
      this.fotoError = error;
      this.uploadingFoto = false;
      this.msgSvc.add({ severity: 'error', summary: 'Archivo invalido', detail: error });
      return;
    }

    this.svc.subirFoto(this.egresado!.id, file).subscribe({
      next: (updated: any) => {
        const fotoUrl = updated.url || updated.foto_url;
        this.egresado = this.egresado ? { ...this.egresado, foto_url: fotoUrl } : updated;
        this.authSvc.updateUsuario({ foto_url: fotoUrl });
        this.uploadingFoto = false;
        this.msgSvc.add({ severity: 'success', summary: 'Foto guardada', detail: 'Tu foto de perfil se subio a Drive correctamente.' });
      },
      error: (err: any) => {
        this.fotoError = err.message ?? 'No se pudo subir la foto.';
        this.uploadingFoto = false;
        this.msgSvc.add({ severity: 'error', summary: 'Error al subir', detail: this.fotoError });
      }
    });
  }

  triggerCvUpload() { this.cvInput.nativeElement.click(); }

  onCvSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.guardarCV(file);
    input.value = '';
  }

  guardarCV(file: File) {
    const error = this.validarArchivo(
      file,
      ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      ['pdf', 'doc', 'docx'],
      'El CV debe ser PDF, DOC o DOCX.'
    );
    if (error) {
      this.msgSvc.add({ severity: 'warn', summary: 'Archivo invalido', detail: error });
      return;
    }

    this.savingCv = true;
    this.svc.subirCV(this.egresado!.id, file).subscribe({
      next: (updated: any) => {
        const cvUrl = updated.url || updated.cv_url;
        this.egresado = this.egresado ? { ...this.egresado, cv_url: cvUrl } : updated;
        this.authSvc.updateUsuario({ cv_url: cvUrl });
        this.savingCv = false;
        this.msgSvc.add({ severity: 'success', summary: 'CV actualizado', detail: 'Tu CV se subio a Drive correctamente.' });
      },
      error: (err: any) => {
        this.savingCv = false;
        this.msgSvc.add({ severity: 'error', summary: 'Error', detail: err.message ?? 'No se pudo subir el CV.' });
      }
    });
  }

  triggerCertificadoUpload() { this.certInput.nativeElement.click(); }

  onCertificadoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const error = this.validarArchivo(file, ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], ['pdf', 'jpg', 'jpeg', 'png', 'webp'], 'El documento debe ser PDF, JPG, PNG o WEBP.');
    if (error) {
      this.msgSvc.add({ severity: 'warn', summary: 'Archivo invalido', detail: error });
      input.value = '';
      return;
    }

    if (this.egresado && this.egresado.certificados.length >= 5) {
      this.msgSvc.add({ severity: 'warn', summary: 'Limite alcanzado', detail: 'Solo puedes subir un maximo de 5 documentos.' });
      input.value = '';
      return;
    }

    this.savingCertificado = true;
    this.svc.subirCertificado(this.egresado!.id, file).subscribe({
      next: (res: any) => {
        this.savingCertificado = false;
        if (this.egresado) {
          this.egresado.certificados.push({
            id: res.id,
            nombre: res.nombre || file.name,
            url: res.url || res.url_documento || ''
          });
        }
        this.msgSvc.add({ severity: 'success', summary: 'Documento anadido', detail: 'El archivo se subio a Drive correctamente.' });
      },
      error: (err: any) => {
        this.savingCertificado = false;
        this.msgSvc.add({ severity: 'error', summary: 'Error', detail: err.message ?? 'No se pudo subir el archivo.' });
      }
    });
    input.value = '';
  }

  eliminarCertificado(index: number) {
    this.confirmSvc.confirm({
      message: '¿Estás seguro de que deseas eliminar este documento? También se borrará permanentemente de Google Drive.',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const cert = this.egresado!.certificados[index];
        this.svc.eliminarCertificado(this.egresado!.id, cert.id!).subscribe({
          next: () => {
            this.egresado!.certificados.splice(index, 1);
            this.msgSvc.add({ severity: 'success', summary: 'Éxito', detail: 'Documento eliminado de Drive' });
          },
          error: (err) => {
            this.msgSvc.add({ severity: 'error', summary: 'Error', detail: err.message });
          }
        });
      }
    });
  }

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
      this.msgSvc.add({ severity: 'warn', summary: 'Campos incompletos', detail: 'La institucion y el grado son obligatorios.' });
      return;
    }

    if (this.editIndex > -1) {
      this.egresado.trayectoria[this.editIndex] = { ...this.editEducacion };
    } else {
      this.egresado.trayectoria.push({ ...this.editEducacion });
    }
    this.displayTrayectoriaModal = false;
    this.msgSvc.add({ severity: 'success', summary: 'Actualizado', detail: 'Tu trayectoria academica ha sido actualizada.' });
  }

  eliminarTrayectoria(index: number) {
    this.confirmSvc.confirm({
      message: '¿Estás seguro de que deseas eliminar este registro académico?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.egresado?.trayectoria.splice(index, 1);
        this.msgSvc.add({ severity: 'info', summary: 'Eliminado', detail: 'Registro eliminado correctamente.' });
      }
    });
  }

  eliminarFoto() {
    this.confirmSvc.confirm({
      message: '¿Estás seguro de que deseas eliminar tu foto de perfil de Google Drive?',
      header: 'Confirmar Eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.svc.eliminarFoto(this.egresado!.id).subscribe(() => {
          this.egresado = this.egresado ? { ...this.egresado, foto_url: '' } : undefined;
          this.authSvc.updateUsuario({ foto_url: '' });
          this.msgSvc.add({ severity: 'success', summary: 'Éxito', detail: 'Foto eliminada' });
        });
      }
    });
  }

  private validarArchivo(file: File, allowedTypes: string[], allowedExtensions: string[], message: string): string | null {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(extension)) return message;
    if (file.size > 15 * 1024 * 1024) return 'El archivo no debe superar los 15 MB.';
    return null;
  }
}
