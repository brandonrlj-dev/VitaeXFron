import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  items: SidebarItem[] = [
    { label: 'Dashboard',         icon: 'pi pi-chart-pie',  route: '/admin/dashboard'    },
    { label: 'Gestión Convenios', icon: 'pi pi-building',   route: '/admin/convenios'    },
    { label: 'Solicitudes',       icon: 'pi pi-file-edit',  route: '/admin/solicitudes'  },
    { label: 'Reportes',          icon: 'pi pi-chart-bar',  route: '/admin/reportes'     },
  ];

  constructor(public authService: AuthService) {}

  logout() { this.authService.logout(); }
}
