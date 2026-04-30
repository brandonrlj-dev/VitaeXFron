import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../../core/services/auth.service';
import { ProfilePhotoService } from '../../../core/services/profile-photo.service';

interface SidebarItem { label: string; icon: string; route: string; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ToastModule],
  providers: [MessageService],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  @ViewChild('logoInput') logoInput!: ElementRef<HTMLInputElement>;

  items: SidebarItem[] = [
    { label: 'Dashboard',         icon: 'pi pi-chart-pie', route: '/admin/dashboard'   },
    { label: 'Gestión Convenios', icon: 'pi pi-building',  route: '/admin/convenios'   },
    { label: 'Solicitudes',       icon: 'pi pi-file-edit', route: '/admin/solicitudes' },
    { label: 'Reportes',          icon: 'pi pi-chart-bar', route: '/admin/reportes'    },
  ];

  uploading = false;

  private authService  = inject(AuthService);
  private photoService = inject(ProfilePhotoService);
  private msgSvc       = inject(MessageService);

  get logoAdmin(): string | null { return this.photoService.logoAdmin(); }

  triggerLogoUpload() { this.logoInput.nativeElement.click(); }

  async onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file  = input.files?.[0];
    if (!file) return;

    this.uploading = true;
    try {
      const dataUrl = await this.photoService.readFile(file);
      this.photoService.setLogoAdmin(dataUrl);
      this.msgSvc.add({ severity: 'success', summary: 'Logo actualizado', detail: 'El logo institucional se guardó correctamente.' });
    } catch (err: any) {
      this.msgSvc.add({ severity: 'error', summary: 'Error', detail: err.message });
    } finally {
      this.uploading = false;
      input.value = '';
    }
  }

  removeLogo() {
    this.photoService.removeLogoAdmin();
    this.msgSvc.add({ severity: 'info', summary: 'Logo eliminado', detail: 'Se restauraron las iniciales.' });
  }

  logout() { this.authService.logout(); }
}
