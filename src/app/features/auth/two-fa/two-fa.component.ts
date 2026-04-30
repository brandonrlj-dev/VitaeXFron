import { Component, inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../../core/services/auth.service';
import { EgresadoService } from '../../../core/services/egresado.service';

@Component({
  selector: 'app-two-fa',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ButtonModule, InputTextModule],
  templateUrl: './two-fa.component.html',
  styleUrls: ['./two-fa.component.scss'],
})
export class TwoFaComponent {
  form;
  loading = false;
  error   = '';

  private fb          = inject(FormBuilder);
  private auth        = inject(AuthService);
  private router      = inject(Router);
  private egresadoSvc = inject(EgresadoService);

  constructor() {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error   = '';

    this.auth.verify2FA(this.form.value.code!).subscribe({
      next: () => {
        this.loading = false;
        const rol = this.auth.getRol();
        if (rol === 'egresado') {
          this.egresadoSvc.getEgresadoActual().subscribe({
            next: egresado => {
              if (!egresado.datos_confirmados) {
                this.router.navigate(['/login/confirmar-datos']);
              } else {
                this.router.navigate(['/egresado/dashboard']);
              }
            },
            error: () => this.router.navigate(['/egresado/dashboard'])
          });
        } else if (rol === 'empresa') {
          this.router.navigate(['/empresa/dashboard']);
        } else {
          this.router.navigate(['/admin/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.message;
      }
    });
  }
}
