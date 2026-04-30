import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { DimensionType, Egresado, Pregunta } from '../models';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, toApiError, unwrapData, unwrapItems } from './api-response';
import { mapCertificado, mapEgresado, mapPregunta } from './api-mappers';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class EgresadoService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  getEgresadoActual(): Observable<Egresado> {
    const id = this.currentEgresadoId();
    if (!id) {
      return throwError(() => new Error('No se pudo identificar el egresado actual en la sesión'));
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
    return this.http.get<ApiEnvelope<any>>(`${environment.apiUrl}/egresados?limit=100`).pipe(
      map(response => unwrapItems<any>(response).map(mapEgresado)),
      catchError(error => toApiError(error, 'No se pudieron cargar los egresados'))
    );
  }

  confirmarDatos(id: string): Observable<void> {
    return this.http.put<ApiEnvelope<any>>(`${environment.apiUrl}/egresados/${id}/perfil`, {
      disponible_laboralmente: true,
    }).pipe(
      map(() => undefined),
      catchError(error => toApiError(error, 'No se pudieron confirmar los datos'))
    );
  }

  getPreguntasPorDimension(dimension: DimensionType): Observable<Pregunta[]> {
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

  subirFoto(egresadoId: string, file: File): Observable<Egresado> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiEnvelope<any>>(`${environment.apiUrl}/egresados/${egresadoId}/foto`, formData).pipe(
      map(response => mapEgresado(unwrapData(response))),
      catchError(error => toApiError(error, 'No se pudo subir la foto'))
    );
  }

  subirCV(egresadoId: string, file: File): Observable<Egresado> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiEnvelope<any>>(`${environment.apiUrl}/egresados/${egresadoId}/cv`, formData).pipe(
      map(response => mapEgresado(unwrapData(response))),
      catchError(error => toApiError(error, 'No se pudo subir el CV'))
    );
  }

  subirCertificado(egresadoId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo_documento', 'certificado');
    formData.append('nombre_archivo', file.name);

    return this.http.post<ApiEnvelope<any>>(`${environment.apiUrl}/egresados/${egresadoId}/certificados`, formData).pipe(
      map(response => mapCertificado(unwrapData(response))),
      catchError(error => toApiError(error, 'No se pudo registrar el certificado'))
    );
  }

  eliminarCertificado(_egresadoId: string, certificadoId: string): Observable<void> {
    return this.http.delete<ApiEnvelope<any>>(`${environment.apiUrl}/certificados/${certificadoId}`).pipe(
      map(() => undefined),
      catchError(error => toApiError(error, 'No se pudo eliminar el certificado'))
    );
  }

  resetEvaluaciones(id: string): Observable<void> {
    return this.http.delete<ApiEnvelope<any>>(`${environment.apiUrl}/egresados/${id}/evaluaciones`).pipe(
      map(() => undefined),
      catchError(error => toApiError(error, 'No se pudieron reiniciar las evaluaciones'))
    );
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
