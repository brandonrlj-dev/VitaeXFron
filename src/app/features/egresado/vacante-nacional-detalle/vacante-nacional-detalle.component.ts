import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { VacanteService } from '../../../core/services/vacante.service';
import { VacanteNacional } from '../../../core/models';

@Component({
  selector: 'app-vacante-nacional-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, ToastModule],
  providers: [MessageService],
  templateUrl: './vacante-nacional-detalle.component.html',
  styleUrls: ['./vacante-nacional-detalle.component.scss']
})
export class VacanteNacionalDetalleComponent implements OnInit {
  vacante?: VacanteNacional;
  loading = true;
  postulado = false;

  private route = inject(ActivatedRoute);
  private vacanteSvc = inject(VacanteService);
  private msgSvc = inject(MessageService);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.vacanteSvc.getVacanteNacionalById(id).subscribe(vn => {
        this.vacante = vn;
        this.loading = false;
      });
    }
  }

  postular() {
    if (!this.vacante) return;
    
    // Al ser externa, redirigimos a la URL de la fuente
    window.open(this.vacante.url_externa, '_blank');
    
    // Pero registramos en nuestro sistema que el egresado se interesó/postuló
    this.postulado = true;
    this.msgSvc.add({ 
      severity: 'success', 
      summary: 'Postulación registrada', 
      detail: 'Se ha abierto el portal externo. La universidad dará seguimiento a tu interés.' 
    });
  }
}
