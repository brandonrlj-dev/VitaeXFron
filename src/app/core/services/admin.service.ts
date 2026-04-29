import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { KpiDashboard, InsercionCarrera, CompetenciaDemandada } from '../models';
import { REPORTE_KPI_MOCK, INSERCION_CARRERAS_MOCK, COMPETENCIAS_DEMANDADAS_MOCK } from '../../shared/mocks/reportes.mock';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getKpis(): Observable<KpiDashboard> {
    if (environment.useMocks) return of(REPORTE_KPI_MOCK).pipe(delay(300));
    return this.http.get<KpiDashboard>(`${environment.apiUrl}/admin/kpis`);
  }

  getInsercionPorCarrera(): Observable<InsercionCarrera[]> {
    if (environment.useMocks) return of(INSERCION_CARRERAS_MOCK).pipe(delay(400));
    return this.http.get<InsercionCarrera[]>(`${environment.apiUrl}/admin/insercion-carrera`);
  }

  getCompetenciasDemandadas(): Observable<CompetenciaDemandada[]> {
    if (environment.useMocks) return of(COMPETENCIAS_DEMANDADAS_MOCK).pipe(delay(300));
    return this.http.get<CompetenciaDemandada[]>(`${environment.apiUrl}/admin/competencias`);
  }

  crearCuentaEmpresa(solicitudId: string): Observable<{ email: string; password: string }> {
    if (environment.useMocks) {
      return of({ email: 'empresa@demo.utc.mx', password: 'Temp2024!' }).pipe(delay(800));
    }
    return this.http.post<{ email: string; password: string }>(
      `${environment.apiUrl}/admin/crear-cuenta-empresa`,
      { solicitud_id: solicitudId }
    );
  }
}
