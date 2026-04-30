import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { Vacante, DimensionScores } from '../models';
import { VACANTES_MOCK } from '../../shared/mocks/vacantes.mock';
import { POSTULACIONES_MOCK } from '../../shared/mocks/egresados.mock';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class VacanteService {
  constructor(private http: HttpClient) {}

  getVacantes(): Observable<Vacante[]> {
    if (environment.useMocks) {
      return of(VACANTES_MOCK).pipe(delay(300));
    }
    return this.http.get<Vacante[]>(`${environment.apiUrl}/vacantes`);
  }

  getVacanteById(id: string): Observable<Vacante | undefined> {
    if (environment.useMocks) {
      return of(VACANTES_MOCK.find(v => v.id === id)).pipe(delay(200));
    }
    return this.http.get<Vacante>(`${environment.apiUrl}/vacantes/${id}`);
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
    if (environment.useMocks) {
      return of(undefined).pipe(delay(600));
    }
    return this.http.post<void>(`${environment.apiUrl}/postulaciones`, {
      egresado_id: egresadoId,
      vacante_id: vacanteId
    });
  }

  getPostulacionesEgresado(egresadoId: string): Observable<any[]> {
    if (environment.useMocks) {
      return of(POSTULACIONES_MOCK).pipe(delay(300));
    }
    return this.http.get<any[]>(`${environment.apiUrl}/egresado/${egresadoId}/postulaciones`);
  }
}
