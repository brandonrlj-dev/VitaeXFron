import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { EgresadoService } from '../../../core/services/egresado.service';
import { ProfilePhotoService } from '../../../core/services/profile-photo.service';
import { Egresado, egresadoNombreCompleto } from '../../../core/models';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, ToastModule],
  providers: [MessageService],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent implements OnInit {
  @ViewChild('fotoInput') fotoInput!: ElementRef<HTMLInputElement>;

  egresado?: Egresado;
  loading     = true;
  cvUrl       = '';
  savingCv    = false;
  uploadingFoto = false;
  fotoError   = '';
  dragOver    = false;

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
}
