import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { LayoutComponent } from './shared/layout/layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./pages/registro/registro.component').then((m) => m.RegistroComponent),
  },
  {
    path: '',
    component: LayoutComponent,
    children: [
      // Rutas públicas (menú público)
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'catalogo',
        loadComponent: () =>
          import('./pages/catalogo/catalogo.component').then((m) => m.CatalogoComponent),
      },
      {
        path: 'nft/:id',
        loadComponent: () =>
          import('./pages/nft-detalle/nft-detalle.component').then(
            (m) => m.NftDetalleComponent
          ),
      },

      // Rutas privadas de Cliente (menú privado protegido por authGuard)
      {
        path: 'favoritos',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/favoritos/favoritos.component').then((m) => m.FavoritosComponent),
      },
      {
        path: 'carrito',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/carrito/carrito.component').then((m) => m.CarritoComponent),
      },
      {
        path: 'mis-ordenes',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/cola-minteo/cola-minteo.component').then(
            (m) => m.ColaMinteoComponent
          ),
      },
      {
        path: 'cola-minteo',
        redirectTo: 'mis-ordenes',
        pathMatch: 'full',
      },
      {
        path: 'chat',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/chat/chat.component').then((m) => m.ChatComponent),
      },
      {
        path: 'perfil',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/perfil/perfil.component').then((m) => m.PerfilComponent),
      },

      // Rutas hijas de Administrador (protegidas por authGuard + adminGuard)
      {
        path: 'admin',
        canActivate: [authGuard, adminGuard],
        loadChildren: () =>
          import('./pages/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
    ],
  },
  // Página 404 (siempre la última ruta)
  {
    path: '**',
    loadComponent: () =>
      import('./pages/no-encontrado/no-encontrado.component').then(
        (m) => m.NoEncontradoComponent
      ),
  },
];
