import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CvPdfOptions {
  vacanteId?: number;
  download?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CvPdfService {
  private http = inject(HttpClient);

  /**
   * Obtiene el PDF del CV de un egresado desde el backend.
   * Retorna un HttpResponse que contiene el Blob para poder leer headers como Content-Disposition.
   * 
   * @param egresadoId ID del egresado
   * @param options Configuración opcional para indicar vacanteId o modo de descarga.
   */
  getCvPdf(egresadoId: number, options?: CvPdfOptions): Observable<HttpResponse<Blob>> {
    let params = new HttpParams();

    if (options?.vacanteId) {
      params = params.set('vacante_id', options.vacanteId.toString());
    }

    if (options?.download) {
      params = params.set('download', '1');
    }

    return this.http.get(`${environment.apiUrl}/egresados/${egresadoId}/cv/pdf`, {
      params,
      responseType: 'blob',
      observe: 'response'
    });
  }
}
