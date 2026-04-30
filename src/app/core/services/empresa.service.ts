import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Empresa, Egresado, SolicitudConvenio, Vacante } from '../models';
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
  constructor(private http: HttpClient, private auth: AuthService) {}

  getEmpresas(): Observable<Empresa[]> {
    return this.http.get<ApiEnvelope<any>>(`${environment.apiUrl}/empresas?limit=100`).pipe(
      map(response => unwrapItems<any>(response).map(mapEmpresa)),
      catchError(error => toApiError(error, 'No se pudieron cargar las empresas'))
    );
  }

  getEmpresaActual(): Observable<Empresa> {
    const id = this.auth.getUsuario()?.cve_empresa;
    if (id) {
      return this.http.get<ApiEnvelope<any>>(`${environment.apiUrl}/empresas/${id}`).pipe(
        map(response => mapEmpresa(unwrapData(response))),
        catchError(error => toApiError(error, 'No se pudo cargar la empresa actual'))
      );
    }

    return throwError(() => new Error('No se pudo identificar la empresa actual en la sesión'));
  }

  subirFoto(empresaId: string, file: File): Observable<Empresa> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiEnvelope<any>>(`${environment.apiUrl}/empresas/${empresaId}/foto`, formData).pipe(
      map(response => mapEmpresa(unwrapData(response))),
      catchError(error => toApiError(error, 'No se pudo subir la foto de empresa'))
    );
  }

  getVacantesEmpresa(empresaId: string): Observable<Vacante[]> {
    return this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/empresas/${empresaId}/vacantes`).pipe(
      map(response => unwrapData(response).map(mapVacante)),
      catchError(error => toApiError(error, 'No se pudieron cargar las vacantes de la empresa'))
    );
  }

  crearVacante(vacante: Partial<Vacante>): Observable<Vacante> {
    const apiPayload = vacanteToApi(vacante);
    return this.http.post<ApiEnvelope<any>>(`${environment.apiUrl}/vacantes`, apiPayload).pipe(
      map(response => this.hydrateVacante(unwrapData(response), vacante)),
      catchError(error => toApiError(error, 'No se pudo crear la vacante'))
    );
  }

  actualizarVacante(id: string, cambios: Partial<Vacante>): Observable<Vacante> {
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
    return this.http.delete<ApiEnvelope<any>>(`${environment.apiUrl}/vacantes/${id}`).pipe(
      map(response => mapVacante(unwrapData(response))),
      catchError(error => toApiError(error, 'No se pudo dar de baja la vacante'))
    );
  }

  evaluarDesempeno(payload: {
    empresa_id: string;
    egresado_id: string;
    postulacion_id?: string;
    calificacion: number;
    comentario: string;
  }): Observable<void> {
    return this.http.post<ApiEnvelope<any>>(`${environment.apiUrl}/empresas/${payload.empresa_id}/evaluaciones-desempeno`, {
      cve_egresado: payload.egresado_id,
      cve_postulacion: payload.postulacion_id,
      calificacion: payload.calificacion,
      comentario: payload.comentario,
    }).pipe(
      map(() => undefined),
      catchError(error => toApiError(error, 'No se pudo registrar la evaluacion de desempeno'))
    );
  }

  getSolicitudes(): Observable<SolicitudConvenio[]> {
    return this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/solicitudes-convenio`).pipe(
      map(response => unwrapData(response).map(mapSolicitud)),
      catchError(error => toApiError(error, 'No se pudieron cargar las solicitudes'))
    );
  }

  crearSolicitudConvenio(solicitud: Omit<SolicitudConvenio, 'id' | 'fecha_solicitud' | 'estatus'>): Observable<SolicitudConvenio> {
    return this.http.post<ApiEnvelope<any>>(`${environment.apiUrl}/solicitudes-convenio`, solicitudToApi(solicitud)).pipe(
      map(response => mapSolicitud(unwrapData(response))),
      catchError(error => toApiError(error, 'No se pudo crear la solicitud de convenio'))
    );
  }

  aprobarSolicitud(id: string): Observable<void> {
    return this.http.put<ApiEnvelope<any>>(`${environment.apiUrl}/solicitudes-convenio/${id}`, {
      estado: 'aprobada',
    }).pipe(
      map(() => undefined),
      catchError(error => toApiError(error, 'No se pudo aprobar la solicitud'))
    );
  }

  rechazarSolicitud(id: string, motivo: string): Observable<void> {
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
    candidatos: { egresado: Egresado; coincidencia: number; vacanteId?: string }[];
  }> {
    return forkJoin({
      dashboard: this.http.get<ApiEnvelope<any>>(`${environment.apiUrl}/dashboard/empresa/${empresaId}`).pipe(map(unwrapData)),
      vacantes: this.getVacantesEmpresa(empresaId),
    }).pipe(
      map(({ dashboard, vacantes }) => {
        const analiticaById = new Map((dashboard?.analitica_vacantes ?? []).map((row: any) => [String(row.cve_vacante), row]));
        const vacantesConAnalitica = vacantes.map(vacante => {
          const row: any = analiticaById.get(vacante.id);
          if (!row) return vacante;
          return {
            ...vacante,
            postulaciones_count: this.numberFrom(row.total_postulacion ?? row.total_postulaciones),
            contratados_count: this.numberFrom(row.total_contratado ?? row.total_contratados),
            cobertura_dias: this.numberFrom(row.dias_promedio_cobertura ?? row.tiempo_promedio_cobertura_dias),
          };
        });

        return {
          vacantes: vacantesConAnalitica,
          postulaciones: (dashboard?.candidatos ?? []).map(mapPostulacion),
          candidatos: (dashboard?.candidatos ?? []).map((row: any) => ({
            egresado: mapEgresado(row),
            coincidencia: Number(row.porcentaje_coincidencia ?? 0),
            vacanteId: String(row.cve_vacante ?? row.vacante_id ?? ''),
          })),
        };
      }),
      catchError(error => toApiError(error, 'No se pudo cargar el dashboard de empresa'))
    );
  }

  private hydrateVacante(row: any, source: Partial<Vacante>): Vacante {
    return mapVacante({
      ...row,
      titulo: row.titulo ?? source.puesto,
      descripcion: row.descripcion ?? source.descripcion,
      area: row.area ?? source.area,
      ubicacion: row.ubicacion ?? source.ubicacion,
      modalidad: row.modalidad ?? source.modalidad,
      salario_rango: row.salario_rango ?? source.salario_rango,
      fecha_cierre: row.fecha_cierre ?? source.fecha_cierre,
      razon_social: source.empresa_nombre,
      cve_empresa: row.cve_empresa ?? source.empresa_id,
      estado: row.estado ?? (source.activa === false ? 'cancelada' : 'publicada'),
      puntaje_psicometrica: source.perfil_ideal?.psicometrica,
      puntaje_cognitiva: source.perfil_ideal?.cognitiva,
      puntaje_tecnica: source.perfil_ideal?.tecnica,
      puntaje_proyectiva: source.perfil_ideal?.proyectiva,
      preguntas_tecnicas: row.preguntas_tecnicas ?? source.preguntas_tecnicas,
    });
  }

  private numberFrom(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
