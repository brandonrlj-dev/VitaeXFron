import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthState, RolUsuario, SiestTokenPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'vtx_token';
  private readonly USER_KEY  = 'vtx_user';
  private readonly ROL_KEY   = 'vtx_rol';

  readonly state = signal<AuthState>({
    token: null,
    rol: null,
    usuario: null,
    isAuthenticated: false
  });

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  login(usuario: string, contrasena: string): Observable<{ token: string }> {
    const creds: Record<string, { rol: RolUsuario; nombre: string }> = {
      'hackaton-2026':  { rol: 'egresado', nombre: 'Carlos Mendoza López' },
      'empresa-demo':   { rol: 'empresa',  nombre: 'TecnoSol del Pacífico' },
      'admin-utc':      { rol: 'admin',    nombre: 'Admin UTC' },
    };

    const passwords: Record<string, string> = {
      'hackaton-2026': 'testing2026',
      'empresa-demo':  'empresa2026',
      'admin-utc':     'admin2026',
    };

    if (creds[usuario] && passwords[usuario] === contrasena) {
      const { rol, nombre } = creds[usuario];
      const token = this.buildMockJwt(usuario, rol, nombre);
      return of({ token }).pipe(tap(r => this.saveSession(r.token)));
    }
    return throwError(() => new Error('Usuario o contraseña incorrectos'));
  }

  verify2FA(code: string): Observable<boolean> {
    if (/^\d{6}$/.test(code)) return of(true);
    return throwError(() => new Error('Código de verificación inválido'));
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROL_KEY);
    this.state.set({ token: null, rol: null, usuario: null, isAuthenticated: false });
    this.router.navigate(['/login']);
  }

  getToken(): string | null  { return this.state().token; }
  getRol():   RolUsuario | null { return this.state().rol; }
  isAuthenticated(): boolean { return this.state().isAuthenticated; }
  getUsuario(): SiestTokenPayload | null { return this.state().usuario; }

  private saveSession(token: string): void {
    const payload = this.decodeJwt(token);
    const rol     = payload?.tipo as RolUsuario ?? 'egresado';
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.ROL_KEY,   rol);
    localStorage.setItem(this.USER_KEY,  JSON.stringify(payload));
    this.state.set({ token, rol, usuario: payload, isAuthenticated: true });
  }

  private restoreSession(): void {
    const token = localStorage.getItem(this.TOKEN_KEY);
    const rol   = localStorage.getItem(this.ROL_KEY) as RolUsuario | null;
    const raw   = localStorage.getItem(this.USER_KEY);
    if (token && rol) {
      this.state.set({
        token,
        rol,
        usuario: raw ? JSON.parse(raw) : null,
        isAuthenticated: true
      });
    }
  }

  private decodeJwt(token: string): SiestTokenPayload | null {
    try {
      const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(b64));
    } catch { return null; }
  }

  private buildMockJwt(usuario: string, tipo: RolUsuario, nombre: string): string {
    const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
      sub: '12345',
      usuario,
      tipo,
      nombre,
      perfil_id: '1',
      cve_persona: '12345',
      cve_division: '1',
      abreviatura_division: 'ITI',
      roles: [{ id: tipo === 'egresado' ? '40' : tipo === 'empresa' ? '50' : '10', nombre: tipo }],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400
    }));
    return `${header}.${payload}.${btoa('sig')}`;
  }
}
