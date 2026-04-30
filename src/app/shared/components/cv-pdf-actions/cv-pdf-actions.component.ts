import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { CvPdfService } from '../../../core/services/cv-pdf.service';

@Component({
  selector: 'app-cv-pdf-actions',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './cv-pdf-actions.component.html',
  styleUrls: ['./cv-pdf-actions.component.scss']
})
export class CvPdfActionsComponent {
  @Input() egresadoId!: number;
  @Input() vacanteId?: number;
  @Input() showCompare = false;

  loadingPreview = false;
  loadingDownload = false;

  private cvPdfSvc = inject(CvPdfService);
  private msgSvc = inject(MessageService);

  previewCv() {
    this.loadingPreview = true;
    this.cvPdfSvc.getCvPdf(this.egresadoId, { vacanteId: this.vacanteId }).subscribe({
      next: (response) => {
        if (response.body) {
          const fileURL = URL.createObjectURL(response.body);
          const newWindow = window.open(fileURL, '_blank');
          
          if (!newWindow) {
            this.msgSvc.add({
              severity: 'warn',
              summary: 'Ventana bloqueada',
              detail: 'Por favor, permite las ventanas emergentes (pop-ups) para ver el PDF.'
            });
          }

          // Limpiar la URL de la memoria despues de unos segundos
          setTimeout(() => URL.revokeObjectURL(fileURL), 10000);
        }
        this.loadingPreview = false;
      },
      error: (err) => {
        this.loadingPreview = false;
        this.handleError(err);
      }
    });
  }

  downloadCv() {
    this.loadingDownload = true;
    this.cvPdfSvc.getCvPdf(this.egresadoId, { vacanteId: this.vacanteId, download: true }).subscribe({
      next: (response) => {
        if (response.body) {
          const fileURL = URL.createObjectURL(response.body);
          let filename = `cv-egresado-${this.egresadoId}.pdf`;

          // Intentar obtener el nombre del archivo del header Content-Disposition si existe
          const contentDisposition = response.headers.get('Content-Disposition');
          if (contentDisposition && contentDisposition.indexOf('filename=') !== -1) {
            const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
            if (matches != null && matches[1]) {
              filename = matches[1];
            }
          } else if (this.vacanteId) {
            filename = `cv-egresado-${this.egresadoId}-vacante-${this.vacanteId}.pdf`;
          }

          const a = document.createElement('a');
          a.href = fileURL;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(fileURL);
        }
        this.loadingDownload = false;
      },
      error: (err) => {
        this.loadingDownload = false;
        this.handleError(err);
      }
    });
  }

  private handleError(err: any) {
    let detail = 'No se pudo conectar con el servidor para generar el PDF.';
    
    if (err.status === 404) {
      detail = 'No se encontró el egresado o faltan datos para generar el reporte.';
    } else if (err.status === 403) {
      detail = 'No tienes permisos para ver o generar este CV.';
    } else if (err.status === 500) {
      detail = 'Error interno en el servidor al generar el PDF. Intenta de nuevo más tarde.';
    }

    this.msgSvc.add({
      severity: 'error',
      summary: 'Error al procesar el CV',
      detail
    });
  }
}
