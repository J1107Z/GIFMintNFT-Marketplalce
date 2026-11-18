import { inject } from '@angular/core';
import { ApiStrategy, GiphyService } from '../core/services/giphy.service';
import { MarketCatalogService } from '../core/services/market-catalog.service';
import { GifCategory } from '../models/gif-nft.model';

// Clase 09 & 13: Custom Hook para encapsular consumo de GIPHY y autocompletado Trie
export function useGiphy() {
  const giphyService = inject(GiphyService);
  const catalogService = inject(MarketCatalogService);

  return {
    catalogo: catalogService.catalogo,
    cargando: giphyService.cargando,
    cargandoInicial: catalogService.cargandoInicial,
    error: giphyService.error,
    metodoActual: giphyService.metodoActual,
    tiempoRespuestaMs: giphyService.tiempoRespuestaMs,
    buscar: (termino: string, metodo: ApiStrategy = 'fetch', categoria?: GifCategory) =>
      catalogService.buscarEnVivo(termino, metodo, categoria),
    autocompletar: (prefijo: string, k: number = 6) => catalogService.autocompletar(prefijo, k),
    cancelar: () => giphyService.cancelarPeticionEnCurso(),
  };
}
