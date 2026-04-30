import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CompetenciaDemandada, InsercionCarrera, KpiDashboard, SolicitudConvenio } from '../models';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, toApiError, unwrapData } from './api-response';
import { buildKpis, mapCompetencia, mapInsercion, mapSolicitud } from './api-mappers';
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
    return this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/dashboard/admin/insercion`).pipe(
      map(response => unwrapData(response).map(mapInsercion)),
      catchError(error => toApiError(error, 'No se pudo cargar la insercion por carrera'))
    );
  }

  getCompetenciasDemandadas(): Observable<CompetenciaDemandada[]> {
    return this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/dashboard/admin/competencias`).pipe(
      map(response => unwrapData(response).map(mapCompetencia)),
      catchError(error => toApiError(error, 'No se pudieron cargar las competencias'))
    );
  }

  reporteInsercionPdfUrl(): string {
    return `${environment.apiUrl}/reportes/insercion/pdf`;
  }

  formalizarSolicitud(solicitudId: string): Observable<SolicitudConvenio> {
    return this.http.put<ApiEnvelope<any>>(`${environment.apiUrl}/solicitudes-convenio/${solicitudId}`, {
      estado: 'formalizada',
    }).pipe(
      map(response => mapSolicitud(unwrapData(response))),
      catchError(error => toApiError(error, 'No se pudo formalizar la solicitud'))
    );
  }
}
