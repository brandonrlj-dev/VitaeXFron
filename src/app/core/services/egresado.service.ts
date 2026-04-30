import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Egresado, DimensionScores, DimensionType, SesionEvaluacion } from '../models';
import { EGRESADOS_MOCK } from '../../shared/mocks/egresados.mock';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class EgresadoService {
  constructor(private http: HttpClient) {}

  getEgresadoActual(): Observable<Egresado> {
    if (environment.useMocks) {
      return of(EGRESADOS_MOCK[0]).pipe(delay(300));
    }
    return this.http.get<Egresado>(`${environment.apiUrl}/egresado/me`);
  }

  getEgresados(): Observable<Egresado[]> {
    if (environment.useMocks) {
      return of(EGRESADOS_MOCK).pipe(delay(300));
    }
    return this.http.get<Egresado[]>(`${environment.apiUrl}/egresados`);
  }

  confirmarDatos(id: string): Observable<void> {
    if (environment.useMocks) {
      return of(undefined).pipe(delay(400));
    }
    return this.http.patch<void>(`${environment.apiUrl}/egresado/${id}/confirmar`, {});
  }

  guardarResultadoEvaluacion(
    egresadoId: string,
    dimension: DimensionType,
    puntaje: number
  ): Observable<void> {
    if (environment.useMocks) {
      return of(undefined).pipe(delay(500));
    }
    return this.http.post<void>(`${environment.apiUrl}/evaluaciones`, {
      egresado_id: egresadoId,
      dimension,
      puntaje
    });
  }

  subirCV(egresadoId: string, driveUrl: string): Observable<void> {
    if (environment.useMocks) {
      return of(undefined).pipe(delay(300));
    }
    return this.http.patch<void>(`${environment.apiUrl}/egresado/${egresadoId}/cv`, {
      cv_url: driveUrl
    });
  }

  subirCertificado(egresadoId: string, file: File): Observable<any> {
    if (environment.useMocks) {
      return of({ url: 'mock_certificate_url.pdf' }).pipe(delay(1000));
    }
    const formData = new FormData();
    formData.append('certificado', file);
    
    return this.http.post(`${environment.apiUrl}/egresado/${egresadoId}/certificado`, formData);
  }

  eliminarCertificado(egresadoId: string, certificadoUrl: string): Observable<void> {
    if (environment.useMocks) {
      return of(undefined).pipe(delay(300));
    }
    return this.http.delete<void>(`${environment.apiUrl}/egresado/${egresadoId}/certificado`, {
      body: { url: certificadoUrl }
    });
  }
}
