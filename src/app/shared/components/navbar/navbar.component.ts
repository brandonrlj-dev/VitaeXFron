import { Component, Input, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { buildEgresadoPhotoUrl, usablePhotoUrl } from '../../../core/services/profile-photo.service';
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
  imports: [CommonModule, ButtonModule, ConfirmDialogModule, RouterLink, RouterLinkActive],
  providers: [ConfirmationService],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  @Input() rol!: RolUsuario;

  navItems: MenuItem[] = [];
  nombreUsuario   = '';
  initialsUsuario = '';

  private authService  = inject(AuthService);
  private confirmSvc   = inject(ConfirmationService);

  get fotoUrl(): string | null {
    const user = this.authService.getUsuario();
    const url = usablePhotoUrl(user?.['foto_url'] ?? user?.['logo_url']);
    if (!url) return null;

    if (this.rol === 'egresado' && user?.['cve_egresado']) {
      return buildEgresadoPhotoUrl(user['cve_egresado'], url);
    }

    return url;
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

  logout() {
    this.confirmSvc.confirm({
      message: '¿Estás seguro de que quieres cerrar sesión?',
      header: 'Cerrar sesión',
      icon: 'pi pi-sign-out',
      acceptLabel: 'Sí, cerrar sesión',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.authService.logout(),
    });
  }
}
