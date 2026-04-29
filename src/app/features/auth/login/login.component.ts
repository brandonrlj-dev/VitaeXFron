import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    ButtonModule, InputTextModule, PasswordModule,
    MessageModule, ProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  form: FormGroup;
  loading  = false;
  error    = '';

  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);
  private router = inject(Router);

  constructor() {
    this.form = this.fb.group({
      usuario:    ['', Validators.required],
      contrasena: ['', Validators.required],
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
        this.router.navigate(['/login/2fa']);
      },
      error: (err) => {
        this.loading = false;
        this.error   = err.message ?? 'Error al iniciar sesión';
      }
    });
  }

  usarCredencial(usuario: string, contrasena: string) {
    this.form.setValue({ usuario, contrasena });
  }
}
