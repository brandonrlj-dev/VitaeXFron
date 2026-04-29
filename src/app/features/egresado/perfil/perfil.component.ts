import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FileUploadModule } from 'primeng/fileupload';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { EgresadoService } from '../../../core/services/egresado.service';
import { Egresado, egresadoNombreCompleto } from '../../../core/models';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, FileUploadModule, ToastModule],
  providers: [MessageService],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
})
export class PerfilComponent implements OnInit {
  egresado?: Egresado;
  loading   = true;
  cvUrl     = '';
  savingCv  = false;

  private svc    = inject(EgresadoService);
  private msgSvc = inject(MessageService);

  get nombreCompleto() { return this.egresado ? egresadoNombreCompleto(this.egresado) : ''; }

  ngOnInit() {
    this.svc.getEgresadoActual().subscribe(e => {
      this.egresado = e;
      this.cvUrl    = e.cv_url ?? '';
      this.loading  = false;
    });
  }

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
