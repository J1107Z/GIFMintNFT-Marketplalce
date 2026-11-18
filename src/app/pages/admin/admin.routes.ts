import { Routes } from '@angular/router';

// Clase 08: Rutas hijas con Lazy Loading para el módulo Admin
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'ventas', pathMatch: 'full' },
      {
        path: 'ventas',
        loadComponent: () =>
          import('./admin-ventas/admin-ventas.component').then((m) => m.AdminVentasComponent),
      },
      {
        path: 'usuarios',
        loadComponent: () =>
          import('./admin-usuarios/admin-usuarios.component').then(
            (m) => m.AdminUsuariosComponent
          ),
      },
    ],
  },
];
