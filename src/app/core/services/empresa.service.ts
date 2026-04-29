import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Empresa, Vacante, SolicitudConvenio } from '../models';
import { EMPRESAS_MOCK } from '../../shared/mocks/empresas.mock';
import { VACANTES_MOCK } from '../../shared/mocks/vacantes.mock';
import { SOLICITUDES_MOCK } from '../../shared/mocks/convenios.mock';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
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
      return of(VACANTES_MOCK.filter(v => v.empresa_id === empresaId)).pipe(delay(300));
    }
    return this.http.get<Vacante[]>(`${environment.apiUrl}/empresa/${empresaId}/vacantes`);
  }

  crearVacante(vacante: Partial<Vacante>): Observable<Vacante> {
    if (environment.useMocks) {
      const nueva = { ...vacante, id: Date.now().toString() } as Vacante;
      return of(nueva).pipe(delay(500));
    }
    return this.http.post<Vacante>(`${environment.apiUrl}/vacantes`, vacante);
  }

  getSolicitudes(): Observable<SolicitudConvenio[]> {
    if (environment.useMocks) return of(SOLICITUDES_MOCK).pipe(delay(300));
    return this.http.get<SolicitudConvenio[]>(`${environment.apiUrl}/solicitudes-convenio`);
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
