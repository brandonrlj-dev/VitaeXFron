import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ProfilePhotoService {
  private readonly FOTO_KEY = 'vtx_foto_egresado';
  private readonly LOGO_KEY = 'vtx_logo_admin';

  readonly fotoEgresado = signal<string | null>(localStorage.getItem(this.FOTO_KEY));
  readonly logoAdmin    = signal<string | null>(localStorage.getItem(this.LOGO_KEY));

  setFotoEgresado(dataUrl: string): void {
    localStorage.setItem(this.FOTO_KEY, dataUrl);
    this.fotoEgresado.set(dataUrl);
  }

  setLogoAdmin(dataUrl: string): void {
    localStorage.setItem(this.LOGO_KEY, dataUrl);
    this.logoAdmin.set(dataUrl);
  }

  removeFotoEgresado(): void {
    localStorage.removeItem(this.FOTO_KEY);
    this.fotoEgresado.set(null);
  }

  removeLogoAdmin(): void {
    localStorage.removeItem(this.LOGO_KEY);
    this.logoAdmin.set(null);
  }

  readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('El archivo debe ser una imagen (JPG, PNG, WEBP).'));
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        reject(new Error('La imagen no debe superar 3 MB.'));
        return;
      }
      const reader = new FileReader();
      reader.onload  = e => resolve(e.target!.result as string);
      reader.onerror = () => reject(new Error('Error al leer el archivo.'));
      reader.readAsDataURL(file);
    });
  }
}
