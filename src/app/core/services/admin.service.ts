import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CompetenciaDemandada, InsercionCarrera, KpiDashboard } from '../models';
import { COMPETENCIAS_DEMANDADAS_MOCK, INSERCION_CARRERAS_MOCK, REPORTE_KPI_MOCK } from '../../shared/mocks/reportes.mock';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, toApiError, unwrapData } from './api-response';
import { buildKpis, mapCompetencia, mapInsercion } from './api-mappers';
import { EgresadoService } from './egresado.service';
import { EmpresaService } from './empresa.service';
import { VacanteService } from './vacante.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(
    private http: HttpClient,
    private egresadoSvc: EgresadoService,
    private empresaSvc: EmpresaService,
    private vacanteSvc: VacanteService,
  ) {}

  getKpis(): Observable<KpiDashboard> {
    if (environment.useMocks) return of(REPORTE_KPI_MOCK);
    return forkJoin({
      egresados: this.egresadoSvc.getEgresados(),
      empresas: this.empresaSvc.getEmpresas(),
      vacantes: this.vacanteSvc.getVacantes(),
      insercion: this.getInsercionPorCarrera(),
    }).pipe(
      map(buildKpis),
      catchError(error => toApiError(error, 'No se pudieron cargar los KPIs'))
    );
  }

  getInsercionPorCarrera(): Observable<InsercionCarrera[]> {
    if (environment.useMocks) return of(INSERCION_CARRERAS_MOCK);
    return this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/dashboard/admin/insercion`).pipe(
      map(response => unwrapData(response).map(mapInsercion)),
      catchError(error => toApiError(error, 'No se pudo cargar la insercion por carrera'))
    );
  }

  getCompetenciasDemandadas(): Observable<CompetenciaDemandada[]> {
    if (environment.useMocks) return of(COMPETENCIAS_DEMANDADAS_MOCK);
    return this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/dashboard/admin/competencias`).pipe(
      map(response => unwrapData(response).map(mapCompetencia)),
      catchError(error => toApiError(error, 'No se pudieron cargar las competencias'))
    );
  }

  crearCuentaEmpresa(solicitudId: string): Observable<{ email: string; password: string }> {
    if (environment.useMocks) return of({ email: 'empresa@demo.utc.mx', password: 'Temp2024!' });
    return this.http.put<ApiEnvelope<any>>(`${environment.apiUrl}/solicitudes-convenio/${solicitudId}`, {
      estado: 'aprobada',
    }).pipe(
      map(response => unwrapData(response)),
      switchMap(solicitud => of({
        email: solicitud.contacto_email ?? 'contacto@empresa.com',
        password: `Temp-${solicitudId}-UTC`,
      })),
      catchError(error => toApiError(error, 'No se pudo aprobar la solicitud'))
    );
  }
}
