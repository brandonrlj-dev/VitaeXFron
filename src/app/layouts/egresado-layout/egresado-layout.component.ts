import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-egresado-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastModule],
  template: `
    <p-toast position="top-right"></p-toast>
    <app-navbar rol="egresado"></app-navbar>
    <main class="layout-main">
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [`
    .layout-main {
      min-height: calc(100vh - var(--navbar-height));
      background: var(--color-bg);
      @media (max-width: 768px) {
        min-height: calc(100vh - 56px);
        padding-bottom: 70px;
      }
    }
  `]
})
export class EgresadoLayoutComponent {}
