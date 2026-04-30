import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, switchMap } from 'rxjs/operators';
import { DimensionType, Educacion, Egresado, Mensaje, Pregunta, ResultadoEvaluacion } from '../models';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, toApiError, unwrapData, unwrapItems } from './api-response';
import { mapCertificado, mapEgresado, mapMensaje, mapPregunta, mapTrayectoria } from './api-mappers';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class EgresadoService {
  private cache$: Observable<Egresado> | null = null;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getEgresadoActual(): Observable<Egresado> {
    if (this.cache$) return this.cache$;

    const id = this.currentEgresadoId();
    if (!id) {
      return throwError(() => new Error('No se pudo identificar el egresado actual en la sesión'));
    }

    const source$ = id ? this.fetchById(id) : this.fetchFirst();
    this.cache$ = source$.pipe(shareReplay(1));
    return this.cache$;
  }

  invalidarCache(): void {
    this.cache$ = null;
  }

  private fetchById(id: string): Observable<Egresado> {
    return forkJoin({
      dashboard: this.http.get<ApiEnvelope<any>>(`${environment.apiUrl}/dashboard/egresado/${id}`).pipe(map(unwrapData), catchError(() => of(null))),
      perfil: this.http.get<ApiEnvelope<any>>(`${environment.apiUrl}/egresados/${id}/perfil`).pipe(map(unwrapData), catchError(() => of(null))),
    }).pipe(
      map(({ dashboard, perfil }) => mapEgresado({
        ...(perfil ?? {}),
        ...(dashboard?.puntajes ?? {}),
        certificados: dashboard?.certificados ?? [],
      })),
      catchError(error => toApiError(error, 'No se pudo cargar el egresado actual'))
    );
  }

  private fetchFirst(): Observable<Egresado> {
    return this.getEgresados().pipe(
      map(items => {
        if (!items.length) throw new Error('No hay egresados registrados');
        return items[0];
      })
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
      map(() => { this.invalidarCache(); }),
      catchError(error => toApiError(error, 'No se pudieron confirmar los datos'))
    );
  }

  getMensajes(egresadoId: string): Observable<Mensaje[]> {
    return this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/mensajes/egresado/${egresadoId}`).pipe(
      map(r => (unwrapData(r) ?? []).map(mapMensaje)),
      catchError(() => of([]))
    );
  }

  enviarMensaje(postulacionId: string, texto: string): Observable<Mensaje> {
    return this.http.post<ApiEnvelope<any>>(`${environment.apiUrl}/mensajes`, {
      cve_postulacion: postulacionId,
      tipo_emisor: 'egresado',
      mensaje: texto,
    }).pipe(
      map(r => mapMensaje(unwrapData(r))),
      catchError(error => toApiError(error, 'No se pudo enviar el mensaje'))
    );
  }

  marcarMensajeLeido(mensajeId: string): Observable<void> {
    return this.http.put<ApiEnvelope<any>>(`${environment.apiUrl}/mensajes/${mensajeId}/leido`, {}).pipe(
      map(() => undefined),
      catchError(() => of(undefined))
    );
  }

  getTrayectoria(egresadoId: string): Observable<Educacion[]> {
    return this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/egresados/${egresadoId}/trayectoria`).pipe(
      map(r => (unwrapData(r) ?? []).map(mapTrayectoria)),
      catchError(() => of([]))
    );
  }

  crearTrayectoria(egresadoId: string, item: Educacion): Observable<Educacion> {
    return this.http.post<ApiEnvelope<any>>(`${environment.apiUrl}/egresados/${egresadoId}/trayectoria`, this.trayectoriaBody(item)).pipe(
      map(r => mapTrayectoria(unwrapData(r))),
      catchError(error => toApiError(error, 'No se pudo guardar la trayectoria'))
    );
  }

  actualizarTrayectoria(itemId: string, item: Educacion): Observable<Educacion> {
    return this.http.put<ApiEnvelope<any>>(`${environment.apiUrl}/trayectoria/${itemId}`, this.trayectoriaBody(item)).pipe(
      map(r => mapTrayectoria(unwrapData(r))),
      catchError(error => toApiError(error, 'No se pudo actualizar la trayectoria'))
    );
  }

  eliminarTrayectoria(itemId: string): Observable<void> {
    return this.http.delete<ApiEnvelope<any>>(`${environment.apiUrl}/trayectoria/${itemId}`).pipe(
      map(() => undefined),
      catchError(error => toApiError(error, 'No se pudo eliminar el registro'))
    );
  }

  private trayectoriaBody(item: Educacion): Record<string, unknown> {
    const [inicioRaw, finRaw] = (item.periodo ?? '').split('—').map(s => s.trim());
    const esActual = !finRaw || finRaw.toLowerCase() === 'actualidad';
    return {
      institucion: item.institucion,
      programa: item.programa ?? item.grado,
      grado: item.grado,
      fecha_inicio: item.fecha_inicio ?? (inicioRaw ? inicioRaw + '-01' : null),
      fecha_fin: item.fecha_fin ?? (esActual ? null : (finRaw ? finRaw + '-01' : null)),
      promedio: item.promedio ?? null,
      descripcion: item.descripcion ?? null,
    };
  }

  getPreguntasPorDimension(dimension: DimensionType, egresadoId?: string): Observable<Pregunta[]> {
    return this.tipoPruebaPorDimension(dimension).pipe(
      switchMap(tipo => {
        const params = egresadoId
          ? new HttpParams().set('cve_egresado', egresadoId)
          : undefined;

        return this.http.get<ApiEnvelope<any[]>>(
          `${environment.apiUrl}/evaluaciones/preguntas/${tipo.cve_tipo_prueba}`,
          { params }
        );
      }),
      map(response => unwrapData(response).map(row => mapPregunta(row, dimension))),
      catchError(error => toApiError(error, 'No se pudieron cargar las preguntas'))
    );
  }

  guardarResultadoEvaluacion(
    egresadoId: string,
    dimension: DimensionType,
    preguntas: Pregunta[],
    respuestas: Record<string, string>
  ): Observable<ResultadoEvaluacion> {
    return this.tipoPruebaPorDimension(dimension).pipe(
      switchMap(tipo => {
        const cvePrueba = preguntas.find(pregunta => pregunta.prueba_id)?.prueba_id ?? tipo.cve_prueba;
        if (!cvePrueba) return throwError(() => new Error('La dimension no tiene prueba activa'));
        return this.http.post<ApiEnvelope<any>>(`${environment.apiUrl}/evaluaciones/iniciar`, {
          cve_egresado: egresadoId,
          cve_prueba: cvePrueba,
        });
      }),
      map(response => unwrapData(response)),
      switchMap(evaluacion => this.http.post<ApiEnvelope<any>>(
        `${environment.apiUrl}/evaluaciones/${evaluacion.cve_evaluacion}/finalizar`,
        {
          respuestas: Object.entries(respuestas).map(([cve_pregunta, cve_opcion_respuesta]) => ({
            cve_pregunta,
            cve_opcion_respuesta,
          })),
          observacion: 'Resultado calculado por backend',
        }
      )),
      map(response => this.mapResultadoEvaluacion(unwrapData(response))),
      catchError(error => toApiError(error, 'No se pudo guardar la evaluacion'))
    );
  }

  private mapResultadoEvaluacion(row: any): ResultadoEvaluacion {
    const data = row?.resultado ?? row ?? {};
    return {
      puntaje_obtenido: Number(data.puntaje_obtenido ?? data.puntaje ?? data.score ?? 0),
      puntaje_global: data.puntaje_global !== undefined ? Number(data.puntaje_global) : undefined,
      observacion: data.observacion,
    };
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
  
  eliminarFoto(egresadoId: string): Observable<void> {
    return this.http.delete<ApiEnvelope<any>>(`${environment.apiUrl}/egresados/${egresadoId}/foto`).pipe(
      map(() => undefined),
      catchError(error => toApiError(error, 'No se pudo eliminar la foto de perfil'))
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
