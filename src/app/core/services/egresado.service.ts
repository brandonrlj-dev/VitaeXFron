import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { DimensionType, Egresado, Pregunta } from '../models';
import { EGRESADOS_MOCK } from '../../shared/mocks/egresados.mock';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, toApiError, unwrapData, unwrapItems } from './api-response';
import { mapCertificado, mapEgresado, mapPregunta } from './api-mappers';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class EgresadoService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  getEgresadoActual(): Observable<Egresado> {
    if (environment.useMocks) return of(EGRESADOS_MOCK[0]);

    const id = this.currentEgresadoId();
    if (!id) {
      return this.getEgresados().pipe(
        map(items => {
          if (!items.length) throw new Error('No hay egresados registrados');
          return items[0];
        })
      );
    }

    return forkJoin({
      dashboard: this.http.get<ApiEnvelope<any>>(`${environment.apiUrl}/dashboard/egresado/${id}`).pipe(map(unwrapData)),
      perfil: this.http.get<ApiEnvelope<any>>(`${environment.apiUrl}/egresados/${id}/perfil`).pipe(map(unwrapData)),
    }).pipe(
      map(({ dashboard, perfil }) => mapEgresado({
        ...(perfil ?? {}),
        ...(dashboard?.puntajes ?? {}),
        certificados: dashboard?.certificados ?? [],
      })),
      catchError(error => toApiError(error, 'No se pudo cargar el egresado actual'))
    );
  }

  getEgresados(): Observable<Egresado[]> {
    if (environment.useMocks) return of(EGRESADOS_MOCK);
    return this.http.get<ApiEnvelope<any>>(`${environment.apiUrl}/egresados?limit=100`).pipe(
      map(response => unwrapItems<any>(response).map(mapEgresado)),
      catchError(error => toApiError(error, 'No se pudieron cargar los egresados'))
    );
  }

  confirmarDatos(id: string): Observable<void> {
    if (environment.useMocks) return of(undefined);
    return this.http.put<ApiEnvelope<any>>(`${environment.apiUrl}/egresados/${id}/perfil`, {
      disponible_laboralmente: true,
    }).pipe(
      map(() => undefined),
      catchError(error => toApiError(error, 'No se pudieron confirmar los datos'))
    );
  }

  getPreguntasPorDimension(dimension: DimensionType): Observable<Pregunta[]> {
    if (environment.useMocks) return of([]);
    return this.tipoPruebaPorDimension(dimension).pipe(
      switchMap(tipo => this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/evaluaciones/preguntas/${tipo.cve_tipo_prueba}`)),
      map(response => unwrapData(response).map(row => mapPregunta(row, dimension))),
      catchError(error => toApiError(error, 'No se pudieron cargar las preguntas'))
    );
  }

  guardarResultadoEvaluacion(
    egresadoId: string,
    dimension: DimensionType,
    puntaje: number
  ): Observable<void> {
    if (environment.useMocks) {
      const e = EGRESADOS_MOCK.find(x => x.id === egresadoId);
      if (e) {
        if (!e.evaluaciones_completadas.includes(dimension)) e.evaluaciones_completadas.push(dimension);
        if (!e.scores) e.scores = { psicometrica: 0, cognitiva: 0, tecnica: 0, proyectiva: 0 };
        e.scores[dimension] = puntaje;
      }
      return of(undefined);
    }

    return this.tipoPruebaPorDimension(dimension).pipe(
      switchMap(tipo => this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/evaluaciones/preguntas/${tipo.cve_tipo_prueba}`)),
      map(response => unwrapData(response)),
      switchMap(preguntas => {
        const cvePrueba = preguntas[0]?.cve_prueba;
        if (!cvePrueba) return throwError(() => new Error('La dimension no tiene prueba activa'));
        return this.http.post<ApiEnvelope<any>>(`${environment.apiUrl}/evaluaciones/iniciar`, {
          cve_egresado: egresadoId,
          cve_prueba: cvePrueba,
        });
      }),
      map(response => unwrapData(response)),
      switchMap(evaluacion => this.http.post<ApiEnvelope<any>>(
        `${environment.apiUrl}/evaluaciones/${evaluacion.cve_evaluacion}/finalizar`,
        { puntaje_obtenido: puntaje, observacion: 'Resultado registrado desde frontend' }
      )),
      map(() => undefined),
      catchError(error => toApiError(error, 'No se pudo guardar la evaluacion'))
    );
  }

  subirCV(egresadoId: string, driveUrl: string): Observable<void> {
    if (environment.useMocks) return of(undefined);
    return this.http.put<ApiEnvelope<any>>(`${environment.apiUrl}/egresados/${egresadoId}/perfil`, {
      url_cv: driveUrl
    }).pipe(
      map(() => undefined),
      catchError(error => toApiError(error, 'No se pudo guardar el CV'))
    );
  }

  subirCertificado(egresadoId: string, file: File): Observable<any> {
    if (environment.useMocks) return of({ url: 'mock_certificate_url.pdf' });
    return this.http.post<ApiEnvelope<any>>(`${environment.apiUrl}/egresados/${egresadoId}/certificados`, {
      tipo_documento: 'certificado',
      nombre_archivo: file.name,
      url_documento: `google-drive://${encodeURIComponent(file.name)}`,
    }).pipe(
      map(response => mapCertificado(unwrapData(response))),
      catchError(error => toApiError(error, 'No se pudo registrar el certificado'))
    );
  }

  eliminarCertificado(_egresadoId: string, certificadoId: string): Observable<void> {
    if (environment.useMocks) return of(undefined);
    return this.http.delete<ApiEnvelope<any>>(`${environment.apiUrl}/certificados/${certificadoId}`).pipe(
      map(() => undefined),
      catchError(error => toApiError(error, 'No se pudo eliminar el certificado'))
    );
  }

  resetEvaluaciones(id: string): Observable<void> {
    if (environment.useMocks) {
      const e = EGRESADOS_MOCK.find(x => x.id === id);
      if (e) {
        e.evaluaciones_completadas = [];
        e.scores = { psicometrica: 0, cognitiva: 0, tecnica: 0, proyectiva: 0 };
      }
    }
    return of(undefined);
  }

  private tipoPruebaPorDimension(dimension: DimensionType): Observable<any> {
    return this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/tipos-prueba`).pipe(
      map(response => unwrapData(response).find(tipo => tipo.categoria === dimension)),
      switchMap(tipo => tipo ? of(tipo) : throwError(() => new Error(`No existe tipo de prueba ${dimension}`)))
    );
  }

  private currentEgresadoId(): string | null {
    const user = this.auth.getUsuario();
    return user?.cve_egresado ? String(user.cve_egresado) : null;
  }
}
