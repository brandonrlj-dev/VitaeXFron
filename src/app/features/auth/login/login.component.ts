import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { EmpresaService } from '../../../core/services/empresa.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    ButtonModule, InputTextModule, PasswordModule,
    MessageModule, ProgressSpinnerModule,
    DialogModule, DropdownModule, ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  form: FormGroup;
  solicitudForm: FormGroup;
  loading  = false;
  error    = '';
  showSolicitudDialog = false;
  enviandoSolicitud   = false;

  readonly zonaOpciones = [
    { label: 'Norte',  value: 'norte' },
    { label: 'Centro', value: 'centro' },
    { label: 'Sur',    value: 'sur' },
  ];

  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);
  private empresaSvc = inject(EmpresaService);
  private msgSvc = inject(MessageService);

  constructor() {
    this.form = this.fb.group({
      usuario:    ['', Validators.required],
      contrasena: ['', Validators.required],
    });

    this.solicitudForm = this.fb.group({
      empresa_nombre:    ['', Validators.required],
      rfc:               ['', [Validators.required, Validators.minLength(12)]],
      contacto_nombre:   ['', Validators.required],
      contacto_email:    ['', [Validators.required, Validators.email]],
      contacto_telefono: ['', Validators.required],
      zona:              ['norte', Validators.required],
      giro:              ['', Validators.required],
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error   = '';

    const { usuario, contrasena } = this.form.value;
    this.auth.login(usuario, contrasena).subscribe({
      next: () => {
        this.loading = false;
        this.redirectByRole();
      },
      error: (err) => {
        this.loading = false;
        this.error   = err.message ?? 'Error al iniciar sesión';
      }
    });
  }

  abrirSolicitudConvenio() {
    this.showSolicitudDialog = true;
  }

  enviarSolicitudConvenio() {
    if (this.solicitudForm.invalid) {
      this.solicitudForm.markAllAsTouched();
      return;
    }

    this.enviandoSolicitud = true;
    this.empresaSvc.crearSolicitudConvenio(this.solicitudForm.value).subscribe({
      next: (solicitud) => {
        this.enviandoSolicitud = false;
        this.showSolicitudDialog = false;
        this.solicitudForm.reset({ zona: 'norte' });
        this.msgSvc.add({
          severity: 'success',
          summary: 'Solicitud enviada',
          detail: `${solicitud.empresa_nombre} quedó registrada para revisión.`,
        });
      },
      error: () => {
        this.enviandoSolicitud = false;
        this.msgSvc.add({
          severity: 'error',
          summary: 'No se pudo enviar',
          detail: 'Revisa la información e intenta nuevamente.',
        });
      }
    });
  }

  private redirectByRole() {
    this.router.navigate(['/login/2fa']);
  }
}
