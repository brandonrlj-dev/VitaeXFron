import { Component, Input, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { RolUsuario } from '../../../core/models';

const NAV_ITEMS: Record<RolUsuario, MenuItem[]> = {
  egresado: [
    { label: 'Inicio',        routerLink: '/egresado/dashboard',     icon: 'pi pi-home'       },
    { label: 'Evaluaciones',  routerLink: '/egresado/evaluaciones',  icon: 'pi pi-clipboard'  },
    { label: 'Vacantes',      routerLink: '/egresado/vacantes',      icon: 'pi pi-briefcase'  },
    { label: 'Postulaciones', routerLink: '/egresado/postulaciones', icon: 'pi pi-send'       },
    { label: 'Mi Perfil',     routerLink: '/egresado/perfil',        icon: 'pi pi-user'       },
  ],
  empresa: [
    { label: 'Dashboard',      routerLink: '/empresa/dashboard',    icon: 'pi pi-chart-bar'  },
    { label: 'Mis Vacantes',   routerLink: '/empresa/vacantes',     icon: 'pi pi-briefcase'  },
    { label: 'Buscar Talento', routerLink: '/empresa/talento',      icon: 'pi pi-search'     },
    { label: 'Mensajes',       routerLink: '/empresa/comunicacion', icon: 'pi pi-envelope'   },
  ],
  admin: [
    { label: 'Dashboard',  routerLink: '/admin/dashboard',   icon: 'pi pi-chart-pie'  },
    { label: 'Convenios',  routerLink: '/admin/convenios',   icon: 'pi pi-building'   },
    { label: 'Solicitudes',routerLink: '/admin/solicitudes', icon: 'pi pi-file-edit'  },
    { label: 'Reportes',   routerLink: '/admin/reportes',    icon: 'pi pi-chart-bar'  },
  ],
};

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, ButtonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  @Input() rol!: RolUsuario;

  navItems: MenuItem[] = [];
  nombreUsuario   = '';
  initialsUsuario = '';

  private authService  = inject(AuthService);
  private router       = inject(Router);

  get fotoUrl(): string | null {
    const user = this.authService.getUsuario();
    const url = user?.['foto_url'] ?? user?.['logo_url'];
    return typeof url === 'string' && url.trim() ? url : null;
  }

  ngOnInit() {
    this.navItems = NAV_ITEMS[this.rol] ?? [];
    const u = this.authService.getUsuario();
    if (u?.nombre) {
      this.nombreUsuario   = u.nombre;
      const parts          = u.nombre.split(' ');
      this.initialsUsuario = (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
    }
  }

  logout() { this.authService.logout(); }
}
