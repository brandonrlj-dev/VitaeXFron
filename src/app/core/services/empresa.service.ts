import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Empresa, Egresado, SolicitudConvenio, Vacante } from '../models';
import { EMPRESAS_MOCK } from '../../shared/mocks/empresas.mock';
import { VACANTES_MOCK } from '../../shared/mocks/vacantes.mock';
import { SOLICITUDES_MOCK } from '../../shared/mocks/convenios.mock';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, toApiError, unwrapData, unwrapItems } from './api-response';
import {
  mapEgresado,
  mapEmpresa,
  mapPostulacion,
  mapSolicitud,
  mapVacante,
  perfilToApi,
  solicitudToApi,
  vacanteToApi,
} from './api-mappers';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class EmpresaService {
  private mockVacantes: Vacante[] = VACANTES_MOCK.map(v => ({ ...v, perfil_ideal: { ...v.perfil_ideal } }));
  private mockSolicitudes: SolicitudConvenio[] = SOLICITUDES_MOCK.map(s => ({ ...s }));

  constructor(private http: HttpClient, private auth: AuthService) {}

  getEmpresas(): Observable<Empresa[]> {
    if (environment.useMocks) return of(EMPRESAS_MOCK);
    return this.http.get<ApiEnvelope<any>>(`${environment.apiUrl}/empresas?limit=100`).pipe(
      map(response => unwrapItems<any>(response).map(mapEmpresa)),
      catchError(error => toApiError(error, 'No se pudieron cargar las empresas'))
    );
  }

  getEmpresaActual(): Observable<Empresa> {
    if (environment.useMocks) return of(EMPRESAS_MOCK[0]);
    const id = this.auth.getUsuario()?.cve_empresa;
    if (id) {
      return this.http.get<ApiEnvelope<any>>(`${environment.apiUrl}/empresas/${id}`).pipe(
        map(response => mapEmpresa(unwrapData(response))),
        catchError(error => toApiError(error, 'No se pudo cargar la empresa actual'))
      );
    }

    return this.getEmpresas().pipe(
      map(empresas => {
        if (!empresas.length) throw new Error('No hay empresas registradas');
        return empresas[0];
      })
    );
  }

  getVacantesEmpresa(empresaId: string): Observable<Vacante[]> {
    if (environment.useMocks) return of(this.mockVacantes.filter(v => v.empresa_id === empresaId));
    return this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/empresas/${empresaId}/vacantes`).pipe(
      map(response => unwrapData(response).map(mapVacante)),
      catchError(error => toApiError(error, 'No se pudieron cargar las vacantes de la empresa'))
    );
  }

  crearVacante(vacante: Partial<Vacante>): Observable<Vacante> {
    if (environment.useMocks) {
      const nueva = { ...vacante, id: Date.now().toString() } as Vacante;
      this.mockVacantes = [nueva, ...this.mockVacantes];
      return of(nueva);
    }

    const apiPayload = vacanteToApi(vacante);
    return this.http.post<ApiEnvelope<any>>(`${environment.apiUrl}/vacantes`, apiPayload).pipe(
      map(response => this.hydrateVacante(unwrapData(response), vacante)),
      catchError(error => toApiError(error, 'No se pudo crear la vacante'))
    );
  }

  actualizarVacante(id: string, cambios: Partial<Vacante>): Observable<Vacante> {
    if (environment.useMocks) {
      const idx = this.mockVacantes.findIndex(v => v.id === id);
      if (idx < 0) throw new Error('Vacante no encontrada');
      const actualizada = {
        ...this.mockVacantes[idx],
        ...cambios,
        perfil_ideal: cambios.perfil_ideal ? { ...cambios.perfil_ideal } : { ...this.mockVacantes[idx].perfil_ideal },
      };
      this.mockVacantes = this.mockVacantes.map(v => v.id === id ? actualizada : v);
      return of(actualizada);
    }

    const apiPayload = vacanteToApi(cambios);
    delete apiPayload.perfil_idoneo;

    const updateVacante$ = this.http.put<ApiEnvelope<any>>(`${environment.apiUrl}/vacantes/${id}`, apiPayload).pipe(
      map(response => unwrapData(response))
    );

    const updatePerfil$: Observable<unknown> = cambios.perfil_ideal
      ? this.http.put<ApiEnvelope<any>>(`${environment.apiUrl}/vacantes/${id}/perfil-idoneo`, perfilToApi(cambios.perfil_ideal))
      : of(null);

    return updateVacante$.pipe(
      switchMap(row => updatePerfil$.pipe(map(() => this.hydrateVacante(row, cambios)))),
      catchError(error => toApiError(error, 'No se pudo actualizar la vacante'))
    );
  }

  darBajaVacante(id: string): Observable<Vacante> {
    if (environment.useMocks) return this.actualizarVacante(id, { activa: false });
    return this.http.delete<ApiEnvelope<any>>(`${environment.apiUrl}/vacantes/${id}`).pipe(
      map(response => mapVacante(unwrapData(response))),
      catchError(error => toApiError(error, 'No se pudo dar de baja la vacante'))
    );
  }

  getSolicitudes(): Observable<SolicitudConvenio[]> {
    if (environment.useMocks) return of(this.mockSolicitudes);
    return this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/solicitudes-convenio`).pipe(
      map(response => unwrapData(response).map(mapSolicitud)),
      catchError(error => toApiError(error, 'No se pudieron cargar las solicitudes'))
    );
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
      return of(nueva);
    }

    return this.http.post<ApiEnvelope<any>>(`${environment.apiUrl}/solicitudes-convenio`, solicitudToApi(solicitud)).pipe(
      map(response => mapSolicitud(unwrapData(response))),
      catchError(error => toApiError(error, 'No se pudo crear la solicitud de convenio'))
    );
  }

  aprobarSolicitud(id: string): Observable<void> {
    if (environment.useMocks) return of(undefined);
    return this.http.put<ApiEnvelope<any>>(`${environment.apiUrl}/solicitudes-convenio/${id}`, {
      estado: 'aprobada',
    }).pipe(
      map(() => undefined),
      catchError(error => toApiError(error, 'No se pudo aprobar la solicitud'))
    );
  }

  rechazarSolicitud(id: string, motivo: string): Observable<void> {
    if (environment.useMocks) return of(undefined);
    return this.http.put<ApiEnvelope<any>>(`${environment.apiUrl}/solicitudes-convenio/${id}`, {
      estado: 'rechazada',
      observacion: motivo,
    }).pipe(
      map(() => undefined),
      catchError(error => toApiError(error, 'No se pudo rechazar la solicitud'))
    );
  }

  getDashboardEmpresa(empresaId: string): Observable<{
    vacantes: Vacante[];
    postulaciones: any[];
    candidatos: { egresado: Egresado; coincidencia: number }[];
  }> {
    if (environment.useMocks) return of({ vacantes: this.mockVacantes, postulaciones: [], candidatos: [] });
    return forkJoin({
      dashboard: this.http.get<ApiEnvelope<any>>(`${environment.apiUrl}/dashboard/empresa/${empresaId}`).pipe(map(unwrapData)),
      vacantes: this.getVacantesEmpresa(empresaId),
    }).pipe(
      map(({ dashboard, vacantes }) => ({
        vacantes,
        postulaciones: (dashboard?.candidatos ?? []).map(mapPostulacion),
        candidatos: (dashboard?.candidatos ?? []).map((row: any) => ({
          egresado: mapEgresado(row),
          coincidencia: Number(row.porcentaje_coincidencia ?? 0),
        })),
      })),
      catchError(error => toApiError(error, 'No se pudo cargar el dashboard de empresa'))
    );
  }

  private hydrateVacante(row: any, source: Partial<Vacante>): Vacante {
    return mapVacante({
      ...row,
      titulo: row.titulo ?? source.puesto,
      descripcion: row.descripcion ?? source.descripcion,
      area: row.area ?? source.area,
      modalidad: row.modalidad ?? source.modalidad,
      razon_social: source.empresa_nombre,
      cve_empresa: row.cve_empresa ?? source.empresa_id,
      estado: row.estado ?? (source.activa === false ? 'cancelada' : 'publicada'),
      puntaje_psicometrica: source.perfil_ideal?.psicometrica,
      puntaje_cognitiva: source.perfil_ideal?.cognitiva,
      puntaje_tecnica: source.perfil_ideal?.tecnica,
      puntaje_proyectiva: source.perfil_ideal?.proyectiva,
    });
  }
}
