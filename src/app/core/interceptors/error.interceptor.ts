import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// Clase 13: Functional HTTP Error Interceptor
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.includes('api.giphy.com')) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('gifmint_access_token');
        }
        router.navigate(['/login']);
      }
      if (err.status === 0) {
        console.error('[HttpClient] Sin conexión o error de CORS');
      } else if (err.status >= 500) {
        console.error('[HttpClient] Error del servidor:', err.status);
      }
      return throwError(() => err);
    })
  );
};
