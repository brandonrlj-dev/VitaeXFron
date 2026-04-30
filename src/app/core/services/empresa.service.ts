import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Empresa, Vacante, SolicitudConvenio } from '../models';
import { EMPRESAS_MOCK } from '../../shared/mocks/empresas.mock';
import { VACANTES_MOCK } from '../../shared/mocks/vacantes.mock';
import { SOLICITUDES_MOCK } from '../../shared/mocks/convenios.mock';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private mockVacantes: Vacante[] = VACANTES_MOCK.map(v => ({
    ...v,
    perfil_ideal: { ...v.perfil_ideal },
  }));

  private mockSolicitudes: SolicitudConvenio[] = SOLICITUDES_MOCK.map(s => ({ ...s }));

  constructor(private http: HttpClient) {}

  getEmpresas(): Observable<Empresa[]> {
    if (environment.useMocks) return of(EMPRESAS_MOCK).pipe(delay(300));
    return this.http.get<Empresa[]>(`${environment.apiUrl}/empresas`);
  }

  getEmpresaActual(): Observable<Empresa> {
    if (environment.useMocks) return of(EMPRESAS_MOCK[0]).pipe(delay(200));
    return this.http.get<Empresa>(`${environment.apiUrl}/empresa/me`);
  }

  getVacantesEmpresa(empresaId: string): Observable<Vacante[]> {
    if (environment.useMocks) {
      return of(this.mockVacantes.filter(v => v.empresa_id === empresaId)).pipe(delay(300));
    }
    return this.http.get<Vacante[]>(`${environment.apiUrl}/empresa/${empresaId}/vacantes`);
  }

  crearVacante(vacante: Partial<Vacante>): Observable<Vacante> {
    if (environment.useMocks) {
      const nueva = { ...vacante, id: Date.now().toString() } as Vacante;
      this.mockVacantes = [nueva, ...this.mockVacantes];
      return of(nueva).pipe(delay(500));
    }
    return this.http.post<Vacante>(`${environment.apiUrl}/vacantes`, vacante);
  }

  actualizarVacante(id: string, cambios: Partial<Vacante>): Observable<Vacante> {
    if (environment.useMocks) {
      const idx = this.mockVacantes.findIndex(v => v.id === id);
      if (idx < 0) return throwError(() => new Error('Vacante no encontrada'));
      const actualizada = {
        ...this.mockVacantes[idx],
        ...cambios,
        perfil_ideal: cambios.perfil_ideal
          ? { ...cambios.perfil_ideal }
          : { ...this.mockVacantes[idx].perfil_ideal },
      };
      this.mockVacantes = this.mockVacantes.map(v => v.id === id ? actualizada : v);
      return of(actualizada).pipe(delay(400));
    }
    return this.http.patch<Vacante>(`${environment.apiUrl}/vacantes/${id}`, cambios);
  }

  darBajaVacante(id: string): Observable<Vacante> {
    if (environment.useMocks) {
      return this.actualizarVacante(id, { activa: false });
    }
    return this.http.patch<Vacante>(`${environment.apiUrl}/vacantes/${id}/baja`, {});
  }

  getSolicitudes(): Observable<SolicitudConvenio[]> {
    if (environment.useMocks) return of(this.mockSolicitudes).pipe(delay(300));
    return this.http.get<SolicitudConvenio[]>(`${environment.apiUrl}/solicitudes-convenio`);
  }

  crearSolicitudConvenio(solicitud: Omit<SolicitudConvenio, 'id' | 'fecha_solicitud' | 'estatus'>): Observable<SolicitudConvenio> {
    if (environment.useMocks) {
      const nueva: SolicitudConvenio = {
        ...solicitud,
        id: `s${Date.now()}`,
        fecha_solicitud: new Date().toISOString().split('T')[0],
        estatus: 'pendiente',
      };
      this.mockSolicitudes = [nueva, ...this.mockSolicitudes];
      return of(nueva).pipe(delay(500));
    }
    return this.http.post<SolicitudConvenio>(`${environment.apiUrl}/solicitudes-convenio`, solicitud);
  }

  aprobarSolicitud(id: string): Observable<void> {
    if (environment.useMocks) return of(undefined).pipe(delay(500));
    return this.http.patch<void>(`${environment.apiUrl}/solicitudes-convenio/${id}/aprobar`, {});
  }

  rechazarSolicitud(id: string, motivo: string): Observable<void> {
    if (environment.useMocks) return of(undefined).pipe(delay(400));
    return this.http.patch<void>(`${environment.apiUrl}/solicitudes-convenio/${id}/rechazar`, { motivo });
  }
}
