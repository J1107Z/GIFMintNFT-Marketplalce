import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

// Clase 10: Guard funcional para rutas exclusivas de Administrador (rol === 'admin')
export const adminGuard: CanActivateFn = async () => {
  const sb = inject(SupabaseService).client;
  const auth = inject(AuthService);
  const router = inject(Router);

  const { data } = await sb.auth.getSession();
  if (!data.session?.user) {
    return router.createUrlTree(['/login']);
  }

  let perfilActual = auth.perfil();
  if (!perfilActual) {
    perfilActual = await auth.cargarPerfil(data.session.user);
  }

  return perfilActual?.rol === 'admin' ? true : router.createUrlTree(['/']);
};
