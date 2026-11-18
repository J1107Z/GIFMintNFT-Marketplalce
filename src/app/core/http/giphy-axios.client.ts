import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { environment } from '../../../environments/environment';

interface TimedRequestConfig extends InternalAxiosRequestConfig {
  metadata?: { inicio: number };
}

// Clase 13: Instancia dedicada con axios.create + interceptores de request y response
export const giphyAxios: AxiosInstance = axios.create({
  baseURL: environment.giphyApiUrl,
  timeout: 10000,
  headers: {
    Accept: 'application/json',
  },
});

// Interceptor de Request: registra tiempos e inyecta token si aplica
giphyAxios.interceptors.request.use(
  (config) => {
    const timedConfig = config as TimedRequestConfig;
    timedConfig.metadata = { inicio: performance.now() };

    const token =
      typeof localStorage !== 'undefined' ? localStorage.getItem('gifmint_access_token') : null;
    if (token && !environment.giphyApiUrl.includes('api.giphy.com')) {
      timedConfig.headers.Authorization = `Bearer ${token}`;
    }

    return timedConfig;
  },
  (error) => Promise.reject(error)
);

// Interceptor de Response: mide duración y estandariza manejo de errores
giphyAxios.interceptors.response.use(
  (response) => {
    const timedConfig = response.config as TimedRequestConfig;
    if (timedConfig.metadata?.inicio !== undefined) {
      const ms = performance.now() - timedConfig.metadata.inicio;
      console.debug(`[Axios GIPHY] ${response.config.url} (${ms.toFixed(0)} ms)`);
    }
    return response;
  },
  (error) => {
    if (axios.isCancel(error)) {
      console.debug('[Axios] Petición cancelada mediante AbortController');
      return Promise.reject(error);
    }
    const status = error.response?.status;
    if (status === 403) {
      console.error('[Axios] Acceso denegado (403)');
    } else if (status === 429) {
      console.warn('[Axios] Límite de peticiones de GIPHY alcanzado (429)');
    } else if (status && status >= 500) {
      console.error('[Axios] Error del servidor:', status);
    } else if (!error.response) {
      console.error('[Axios] Error de red o timeout');
    }
    return Promise.reject(error);
  }
);
