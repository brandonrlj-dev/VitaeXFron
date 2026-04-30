import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'login/confirmar-datos',
    canActivate: [authGuard, roleGuard(['egresado'])],
    loadComponent: () => import('./features/auth/confirmar-datos/confirmar-datos.component').then(m => m.ConfirmarDatosComponent)
  },
  {
    path: 'egresado',
    canActivate: [authGuard, roleGuard(['egresado'])],
    loadComponent: () => import('./layouts/egresado-layout/egresado-layout.component').then(m => m.EgresadoLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/egresado/dashboard/egresado-dashboard.component').then(m => m.EgresadoDashboardComponent)
      },
      {
        path: 'evaluaciones',
        loadComponent: () => import('./features/egresado/evaluaciones/evaluaciones.component').then(m => m.EvaluacionesComponent)
      },
      {
        path: 'vacantes',
        loadComponent: () => import('./features/egresado/vacantes/vacantes.component').then(m => m.VacantesComponent)
      },
      {
        path: 'vacantes/:id',
        loadComponent: () => import('./features/egresado/vacante-detalle/vacante-detalle.component').then(m => m.VacanteDetalleComponent)
      },
      {
        path: 'vacantes/nacional/:id',
        loadComponent: () => import('./features/egresado/vacante-nacional-detalle/vacante-nacional-detalle.component').then(m => m.VacanteNacionalDetalleComponent)
      },
      {
        path: 'perfil',
        loadComponent: () => import('./features/egresado/perfil/perfil.component').then(m => m.PerfilComponent)
      },
      {
        path: 'postulaciones',
        loadComponent: () => import('./features/egresado/postulaciones/postulaciones.component').then(m => m.PostulacionesComponent)
      }
    ]
  },
  {
    path: 'empresa',
    canActivate: [authGuard, roleGuard(['empresa'])],
    loadComponent: () => import('./layouts/empresa-layout/empresa-layout.component').then(m => m.EmpresaLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/empresa/dashboard/empresa-dashboard.component').then(m => m.EmpresaDashboardComponent)
      },
      {
        path: 'vacantes',
        loadComponent: () => import('./features/empresa/vacantes/empresa-vacantes.component').then(m => m.EmpresaVacantesComponent)
      },
      {
        path: 'talento',
        loadComponent: () => import('./features/empresa/talento/talento.component').then(m => m.TalentoComponent)
      },
      {
        path: 'comunicacion',
        loadComponent: () => import('./features/empresa/comunicacion/comunicacion.component').then(m => m.ComunicacionComponent)
      }
    ]
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'convenios',
        loadComponent: () => import('./features/admin/convenios/convenios.component').then(m => m.ConveniosComponent)
      },
      {
        path: 'solicitudes',
        loadComponent: () => import('./features/admin/solicitudes/solicitudes.component').then(m => m.SolicitudesComponent)
      },
      {
        path: 'reportes',
        loadComponent: () => import('./features/admin/reportes/reportes.component').then(m => m.ReportesComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/login' }
];
