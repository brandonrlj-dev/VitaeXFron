import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolUsuario } from '../models';

export const roleGuard = (allowedRoles: RolUsuario[]): CanActivateFn => {
  return () => {
    const auth   = inject(AuthService);
    const router = inject(Router);
    const rol    = auth.getRol();

    if (rol && allowedRoles.includes(rol as RolUsuario)) return true;

    router.navigate(['/login']);
    return false;
  };
};
