import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { DimensionScores, Egresado, Vacante, VacanteNacional } from '../models';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, toApiError, unwrapData, unwrapItems } from './api-response';
import { mapEgresado, mapPostulacion, mapVacante, mapVacanteNacional } from './api-mappers';

@Injectable({ providedIn: 'root' })
export class VacanteService {
  constructor(private http: HttpClient) {}

  getVacantes(): Observable<Vacante[]> {
    return this.http.get<ApiEnvelope<any>>(`${environment.apiUrl}/vacantes?limit=100`).pipe(
      map(response => unwrapItems<any>(response).map(mapVacante)),
      catchError(error => toApiError(error, 'No se pudieron cargar las vacantes'))
    );
  }

  getVacanteById(id: string): Observable<Vacante | undefined> {
    return this.http.get<ApiEnvelope<any>>(`${environment.apiUrl}/vacantes/${id}`).pipe(
      map(response => mapVacante(unwrapData(response))),
      catchError(error => toApiError(error, 'No se pudo cargar la vacante'))
    );
  }

  getVacantesNacionales(): Observable<VacanteNacional[]> {
    return this.http.get<ApiEnvelope<any>>(`${environment.apiUrl}/vacantes-nacionales?limit=100`).pipe(
      map(response => unwrapItems<any>(response).map(mapVacanteNacional)),
      catchError(error => toApiError(error, 'No se pudieron cargar las vacantes nacionales'))
    );
  }

  getVacanteNacionalById(id: string): Observable<VacanteNacional | undefined> {
    return this.http.get<ApiEnvelope<any>>(`${environment.apiUrl}/vacantes-nacionales/${id}`).pipe(
      map(response => mapVacanteNacional(unwrapData(response))),
      catchError(error => toApiError(error, 'No se pudo cargar la vacante nacional'))
    );
  }

  getMatchingEgresado(egresadoId: string): Observable<Record<string, number>> {
    return this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/egresados/${egresadoId}/matching`).pipe(
      map(response => unwrapData(response).reduce((acc, row) => {
        acc[String(row.cve_vacante)] = Number(row.porcentaje_coincidencia ?? 0);
        return acc;
      }, {} as Record<string, number>)),
      catchError(() => of({}))
    );
  }

  getCandidatosVacante(vacanteId: string): Observable<{ egresado: Egresado; coincidencia: number }[]> {
    return this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/vacantes/${vacanteId}/candidatos?porcentaje_minimo=80`).pipe(
      map(response => unwrapData(response).map(row => ({
        egresado: mapEgresado(row),
        coincidencia: Number(row.porcentaje_coincidencia ?? 0),
      }))),
      catchError(error => toApiError(error, 'No se pudieron cargar los candidatos'))
    );
  }

  calcularCoincidencia(egresadoScores: DimensionScores, perfilIdeal: DimensionScores): number {
    const dims = ['psicometrica', 'cognitiva', 'tecnica', 'proyectiva'] as const;
    const total = dims.reduce((sum, dim) => {
      const score = egresadoScores[dim];
      const ideal = perfilIdeal[dim];
      return sum + (ideal <= 0 ? 1 : Math.min(score / ideal, 1));
    }, 0);
    return Math.round((total / 4) * 100);
  }

  postularme(egresadoId: string, vacanteId: string): Observable<void> {
    return this.http.post<ApiEnvelope<any>>(`${environment.apiUrl}/postulaciones`, {
      cve_egresado: egresadoId,
      cve_vacante: vacanteId
    }).pipe(
      map(() => undefined),
      catchError(error => toApiError(error, 'No se pudo enviar la postulacion'))
    );
  }

  getPostulacionesEgresado(egresadoId: string): Observable<any[]> {
    return this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/egresados/${egresadoId}/postulaciones`).pipe(
      map(response => unwrapData(response).map(mapPostulacion)),
      catchError(error => toApiError(error, 'No se pudieron cargar las postulaciones'))
    );
  }
}
