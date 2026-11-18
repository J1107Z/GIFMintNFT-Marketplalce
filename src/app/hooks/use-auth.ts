import { inject } from '@angular/core';
import { AuthService } from '../core/services/auth.service';

// Clase 09: Custom Hook para encapsular lógica de autenticación en componentes
export function useAuth() {
  const authService = inject(AuthService);

  return {
    session: authService.session,
    usuario: authService.usuario,
    perfil: authService.perfil,
    rol: authService.rol,
    esAdmin: authService.esAdmin,
    estaLogueado: authService.estaLogueado,
    nombreVisible: authService.nombreVisible,
    cargando: authService.cargando,
    error: authService.error,
    entrar: (email: string, clave: string) => authService.entrar(email, clave),
    registrar: (email: string, clave: string, nombre: string) =>
      authService.registrar(email, clave, nombre),
    actualizarPerfil: (cambios: { nombre?: string; avatar_url?: string }) =>
      authService.actualizarPerfil(cambios),
    salir: () => authService.salir(),
  };
}
