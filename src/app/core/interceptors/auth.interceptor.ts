import { HttpInterceptorFn } from '@angular/common/http';

// Clase 13: Functional HTTP Interceptor para inyectar token cuando el destino lo soporta
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token =
    typeof localStorage !== 'undefined' ? localStorage.getItem('gifmint_access_token') : null;

  // Evitar headers custom en peticiones públicas a GIPHY para no disparar preflight CORS bloqueado
  if (!token || req.url.includes('api.giphy.com')) {
    return next(req);
  }

  const reqConToken = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(reqConToken);
};
