import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, ToastModule],
  template: `
    <p-toast position="top-right"></p-toast>
    <div class="admin-shell">
      <app-sidebar></app-sidebar>
      <main class="admin-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-shell {
      display: flex;
      min-height: 100vh;
    }
    .admin-content {
      flex: 1;
      min-width: 0;
      background: var(--color-bg);
    }
  `]
})
export class AdminLayoutComponent {}
