import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  GIF_CATEGORIES,
  GifCategory,
  GifNft,
  GiphyApiResponse,
  GiphyGifRaw,
  GiphySingleResponse,
  enrichGifToNft,
} from '../../models/gif-nft.model';
import { giphyAxios } from '../http/giphy-axios.client';

export type ApiStrategy = 'fetch' | 'axios' | 'httpclient';

@Injectable({
  providedIn: 'root',
})
export class GiphyService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.giphyApiUrl;
  private readonly apiKey = environment.giphyApiKey;

  private searchAbortController: AbortController | null = null;

  readonly cargando = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly metodoActual = signal<ApiStrategy>('fetch');
  readonly ultimoTermino = signal<string>('');
  readonly tiempoRespuestaMs = signal<number | null>(null);

  cancelarPeticionEnCurso(): void {
    if (this.searchAbortController) {
      this.searchAbortController.abort();
      this.searchAbortController = null;
    }
  }

  // Estrategia 1 (Clase 13): fetch + URLSearchParams + AbortController + AbortSignal.timeout + chequeo !res.ok
  async buscarConFetch(
    termino: string,
    limite: number = 16,
    categoriaForzada?: GifCategory
  ): Promise<GifNft[]> {
    const query = termino.trim();
    if (!query) return [];

    this.cancelarPeticionEnCurso();
    this.searchAbortController = new AbortController();
    const signal = AbortSignal.any([
      this.searchAbortController.signal,
      AbortSignal.timeout(9000),
    ]);

    this.cargando.set(true);
    this.error.set(null);
    this.metodoActual.set('fetch');
    this.ultimoTermino.set(query);
    const inicio = performance.now();

    try {
      const params = new URLSearchParams({
        api_key: this.apiKey,
        q: query,
        limit: limite.toString(),
        offset: '0',
        rating: 'g',
        lang: 'en',
      });

      const resp = await fetch(`${this.baseUrl}/search?${params}`, { signal });
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const json: GiphyApiResponse = await resp.json();
      this.tiempoRespuestaMs.set(Math.round(performance.now() - inicio));
      return json.data.map((raw) => enrichGifToNft(raw, categoriaForzada));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.debug('[GiphyService - Fetch] Búsqueda cancelada por nueva consulta o desmontaje');
        return [];
      }
      const msg = err instanceof Error ? err.message : 'No se pudo cargar el catálogo en este momento.';
      this.error.set(msg);
      return [];
    } finally {
      this.cargando.set(false);
    }
  }

  // Estrategia 2 (Clase 13): Axios con instancia axios.create + interceptores + AbortController
  async buscarConAxios(
    termino: string,
    limite: number = 16,
    categoriaForzada?: GifCategory
  ): Promise<GifNft[]> {
    const query = termino.trim();
    if (!query) return [];

    this.cancelarPeticionEnCurso();
    this.searchAbortController = new AbortController();

    this.cargando.set(true);
    this.error.set(null);
    this.metodoActual.set('axios');
    this.ultimoTermino.set(query);
    const inicio = performance.now();

    try {
      const { data } = await giphyAxios.get<GiphyApiResponse>('/search', {
        params: {
          api_key: this.apiKey,
          q: query,
          limit: limite,
          offset: 0,
          rating: 'g',
          lang: 'en',
        },
        signal: this.searchAbortController.signal,
      });

      this.tiempoRespuestaMs.set(Math.round(performance.now() - inicio));
      return data.data.map((raw) => enrichGifToNft(raw, categoriaForzada));
    } catch (err: unknown) {
      if (err instanceof Error && (err.name === 'CanceledError' || err.name === 'AbortError')) {
        return [];
      }
      const msg = err instanceof Error ? err.message : 'No se pudo completar la búsqueda.';
      this.error.set(msg);
      return [];
    } finally {
      this.cargando.set(false);
    }
  }

  // Estrategia 3 (Clase 13): Angular HttpClient con provideHttpClient(withFetch(), withInterceptors(...))
  async buscarConHttpClient(
    termino: string,
    limite: number = 16,
    categoriaForzada?: GifCategory
  ): Promise<GifNft[]> {
    const query = termino.trim();
    if (!query) return [];

    this.cargando.set(true);
    this.error.set(null);
    this.metodoActual.set('httpclient');
    this.ultimoTermino.set(query);
    const inicio = performance.now();

    try {
      const params = new HttpParams()
        .set('api_key', this.apiKey)
        .set('q', query)
        .set('limit', limite.toString())
        .set('offset', '0')
        .set('rating', 'g')
        .set('lang', 'en');

      const resp = await firstValueFrom(
        this.http.get<GiphyApiResponse>(`${this.baseUrl}/search`, { params })
      );

      this.tiempoRespuestaMs.set(Math.round(performance.now() - inicio));
      return resp.data.map((raw) => enrichGifToNft(raw, categoriaForzada));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo cargar la colección.';
      this.error.set(msg);
      return [];
    } finally {
      this.cargando.set(false);
    }
  }

  async buscar(
    termino: string,
    metodo: ApiStrategy = 'fetch',
    limite: number = 16,
    categoria?: GifCategory
  ): Promise<GifNft[]> {
    switch (metodo) {
      case 'axios':
        return this.buscarConAxios(termino, limite, categoria);
      case 'httpclient':
        return this.buscarConHttpClient(termino, limite, categoria);
      default:
        return this.buscarConFetch(termino, limite, categoria);
    }
  }

  // Clase 13: Promise.allSettled para cargar ~20 GIF-NFTs únicos y coherentes por cada una de las 6 categorías
  async cargarColeccionesIniciales(): Promise<GifNft[]> {
    const TARGET_PER_CATEGORY = 20;

    const categorySearchPlan: { categoria: GifCategory; queries: string[] }[] = [
      {
        categoria: 'Cyberpunk',
        queries: ['cyberpunk neon sci-fi', 'cyberpunk futuristic', 'synthwave neon'],
      },
      {
        categoria: 'Anime',
        queries: ['anime manga loop', 'anime', 'japanese anime'],
      },
      {
        categoria: 'Gaming',
        queries: ['gaming video games pixel art', 'video games arcade', 'pixel art game'],
      },
      {
        categoria: 'Arte 3D',
        queries: ['3d abstract motion render', '3d render loop', 'abstract geometric 3d'],
      },
      {
        categoria: 'Memes',
        queries: ['funny memes viral', 'funny meme', 'meme viral'],
      },
      {
        categoria: 'Reacciones',
        queries: [
          'reaction face laughing bored tired',
          'reaction face',
          'bored tired coffee',
          'laughing reaction',
        ],
      },
    ];

    const fetchQueryRaw = async (query: string, limit: number = 30): Promise<GiphyGifRaw[]> => {
      const params = new URLSearchParams({
        api_key: this.apiKey,
        q: query,
        limit: limit.toString(),
        offset: '0',
        rating: 'g',
        lang: 'en',
      });
      const url = `${this.baseUrl}/search?${params}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(9000) });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} en ${query}`);
      }
      const json: GiphyApiResponse = await res.json();
      return json.data ?? [];
    };

    const buckets = new Map<GifCategory, GifNft[]>(GIF_CATEGORIES.map((c) => [c, []]));
    const seenIds = new Set<string>();
    const maxWaves = Math.max(...categorySearchPlan.map((p) => p.queries.length));

    for (let wave = 0; wave < maxWaves; wave++) {
      const pendingPlan = categorySearchPlan.filter(
        (plan) =>
          wave < plan.queries.length &&
          (buckets.get(plan.categoria)?.length ?? 0) < TARGET_PER_CATEGORY
      );

      if (pendingPlan.length === 0) {
        break;
      }

      const resultados = await Promise.allSettled(
        pendingPlan.map((plan) =>
          fetchQueryRaw(plan.queries[wave], 30).then((rawList) => ({
            categoriaEsperada: plan.categoria,
            rawList,
          }))
        )
      );

      const reasignados: GifNft[] = [];

      // Primera pasada: asignar al bucket de la categoría consultada solo ítems coherentes
      for (const r of resultados) {
        if (r.status !== 'fulfilled') {
          console.warn('[Promise.allSettled] Bloque falló:', r.reason);
          continue;
        }
        const { categoriaEsperada, rawList } = r.value;
        const targetBucket = buckets.get(categoriaEsperada)!;

        for (const raw of rawList) {
          if (!raw?.id || seenIds.has(raw.id)) {
            continue;
          }
          const nft = enrichGifToNft(raw, categoriaEsperada);
          if (nft.categoria === categoriaEsperada) {
            if (targetBucket.length < TARGET_PER_CATEGORY) {
              targetBucket.push(nft);
              seenIds.add(nft.id);
            }
          } else {
            reasignados.push(nft);
          }
        }
      }

      // Segunda pasada: aprovechar ítems reclasificados semánticamente solo si el bucket destino aún requiere ítems
      for (const nft of reasignados) {
        if (seenIds.has(nft.id)) continue;
        const destBucket = buckets.get(nft.categoria);
        if (destBucket && destBucket.length < TARGET_PER_CATEGORY) {
          destBucket.push(nft);
          seenIds.add(nft.id);
        }
      }
    }

    // Intercalado equilibrado (round-robin) entre las 6 categorías para que Home "Todos" muestre variedad
    const catalogoBalanceado: GifNft[] = [];
    for (let i = 0; i < TARGET_PER_CATEGORY; i++) {
      for (const cat of GIF_CATEGORIES) {
        const item = buckets.get(cat)?.[i];
        if (item) {
          catalogoBalanceado.push(item);
        }
      }
    }

    if (catalogoBalanceado.length > 0) {
      return catalogoBalanceado;
    }

    // Respaldo con Promise.all si todas las consultas temáticas fallaran
    try {
      const [reaccionRaw, memeRaw] = await Promise.all([
        fetchQueryRaw('reaction', 20),
        fetchQueryRaw('meme', 20),
      ]);
      const respaldoUnicos = new Map<string, GifNft>();
      for (const raw of [...reaccionRaw, ...memeRaw]) {
        if (!respaldoUnicos.has(raw.id)) {
          respaldoUnicos.set(raw.id, enrichGifToNft(raw));
        }
      }
      const lista = Array.from(respaldoUnicos.values());
      return lista.length > 0 ? lista : this.generarFallbackResiliente();
    } catch {
      return this.generarFallbackResiliente();
    }
  }

  // Estrategia 3 activa (Clase 13): Obtener detalle individual por ID via Angular HttpClient + interceptores
  async obtenerPorId(id: string): Promise<GifNft | null> {
    const cleanId = id.trim();
    if (!cleanId) return null;

    this.metodoActual.set('httpclient');
    const inicio = performance.now();

    try {
      const params = new HttpParams().set('api_key', this.apiKey);
      const json = await firstValueFrom(
        this.http.get<GiphySingleResponse>(
          `${this.baseUrl}/${encodeURIComponent(cleanId)}`,
          { params }
        )
      );
      this.tiempoRespuestaMs.set(Math.round(performance.now() - inicio));
      return enrichGifToNft(json.data);
    } catch (err) {
      console.warn('[GiphyService] Error obteniendo GIF por ID:', err);
      return null;
    }
  }

  // Solo si no hay conectividad a GIPHY en absoluto
  private generarFallbackResiliente(): GifNft[] {
    return GIF_CATEGORIES.map((cat, idx) => ({
      id: `demo-gif-${idx + 1}`,
      titulo: `${cat} Genesis Drop #${idx + 1}`,
      gifUrl: 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif',
      previewUrl: 'https://media.giphy.com/media/3o7aD2saalBwwftBIY/200.gif',
      creador: 'GIFMint Studio',
      precio: 35 + idx * 32,
      precioEth: Number(((35 + idx * 32) / 3000).toFixed(4)),
      rareza: idx % 2 === 0 ? 'Épico' : 'Raro',
      edicion: `#0${idx + 1}/25`,
      categoria: cat,
      popularidad: 82 + idx * 2,
      tokenHash: `0x00a1f${idx}9e`,
      red: 'Ethereum Sepolia L2',
    }));
  }
}
