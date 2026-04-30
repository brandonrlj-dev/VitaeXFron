import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiEnvelope, toApiError, unwrapData } from './api-response';

export interface MensajeView {
  id: string;
  candidato: string;
  egresadoId?: string;
  vacanteId?: string;
  postulacionId?: string;
  initials: string;
  asunto: string;
  preview: string;
  contenido: string;
  fecha: string;
  leido: boolean;
  tipo: 'enviado' | 'recibido';
}

@Injectable({ providedIn: 'root' })
export class MensajeService {
  constructor(private http: HttpClient) {}

  porEmpresa(empresaId: string): Observable<MensajeView[]> {
    return this.http.get<ApiEnvelope<any[]>>(`${environment.apiUrl}/mensajes/empresa/${empresaId}`).pipe(
      map(response => unwrapData(response).map(row => this.mapMensaje(row, 'empresa'))),
      catchError(error => toApiError(error, 'No se pudieron cargar los mensajes'))
    );
  }

  enviar(payload: {
    cve_postulacion?: string;
    cve_egresado?: string;
    cve_vacante?: string;
    remitente: 'empresa' | 'egresado' | 'admin';
    contenido: string;
  }): Observable<MensajeView> {
    return this.http.post<ApiEnvelope<any>>(`${environment.apiUrl}/mensajes`, payload).pipe(
      map(response => this.mapMensaje(unwrapData(response), payload.remitente)),
      catchError(error => toApiError(error, 'No se pudo enviar el mensaje'))
    );
  }

  marcarLeido(id: string): Observable<void> {
    return this.http.put<ApiEnvelope<any>>(`${environment.apiUrl}/mensajes/${id}/leido`, {}).pipe(
      map(() => undefined),
      catchError(error => toApiError(error, 'No se pudo marcar el mensaje como leido'))
    );
  }

  private mapMensaje(row: any, emisorActual: string): MensajeView {
    const nombreCompleto = [row.nombre, row.primer_apellido, row.segundo_apellido]
      .filter(Boolean)
      .join(' ');
    const candidato = row.egresado_nombre ?? (nombreCompleto || 'Candidato');
    const contenido = row.mensaje ?? row.contenido ?? '';
    const tipoEmisor = row.tipo_emisor ?? row.remitente;
    return {
      id: String(row.cve_mensaje ?? row.id),
      candidato,
      egresadoId: row.cve_egresado ? String(row.cve_egresado) : undefined,
      vacanteId: row.cve_vacante ? String(row.cve_vacante) : undefined,
      postulacionId: row.cve_postulacion ? String(row.cve_postulacion) : undefined,
      initials: candidato.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join('').toUpperCase(),
      asunto: row.vacante ? `Vacante: ${row.vacante}` : 'Mensaje de seguimiento',
      preview: contenido,
      contenido,
      fecha: String(row.fecha_envio ?? row.fecha ?? '').split('T')[0],
      leido: Boolean(row.leido),
      tipo: tipoEmisor === emisorActual ? 'enviado' : 'recibido',
    };
  }
}
