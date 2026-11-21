import { Component, OnDestroy, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { MarketCatalogService } from '../../core/services/market-catalog.service';
import { useGiphy } from '../../hooks/use-giphy';
import {
  GIF_CATEGORIES,
  GIF_RARITIES,
  GifCategory,
  GifNft,
  GifRarity,
} from '../../models/gif-nft.model';
import { GifCardComponent } from '../../shared/gif-card/gif-card.component';
import { LoaderComponent } from '../../shared/loader/loader.component';

export type SortOption = 'relevancia' | 'precio_asc' | 'precio_desc' | 'popularidad';

@Component({
  selector: 'app-catalogo',
  imports: [FormsModule, GifCardComponent, LoaderComponent],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.scss',
})
export class CatalogoComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private catalog = inject(MarketCatalogService);
  protected cart = inject(CartService);
  protected giphyHook = useGiphy();

  // Clase 08: Query params vinculados automáticamente (?q=...&cat=...)
  q = input<string>('');
  cat = input<string>('');

  readonly categorias = GIF_CATEGORIES;
  readonly rarezas = GIF_RARITIES;
  readonly sugerenciasRapidas = ['cyberpunk', 'anime', 'pixel game', '3d loop', 'meme cat', 'smile'];

  readonly terminoBusqueda = signal<string>('');
  readonly categoriaFiltro = signal<GifCategory | 'Todas'>('Todas');
  readonly rarezaFiltro = signal<GifRarity | 'Todas'>('Todas');
  readonly ordenSeleccionado = signal<SortOption>('relevancia');
  readonly resultadosBusqueda = signal<GifNft[] | null>(null);

  private temporizador?: ReturnType<typeof setTimeout>;
  private solicitudActualId = 0;
  private ultimoQueryDeUrl = '';
  private ultimaCatDeUrl: GifCategory | 'Todas' = 'Todas';

  readonly listaVisible = computed<GifNft[]>(() => {
    const base = this.resultadosBusqueda() ?? this.catalog.catalogo();
    const cat = this.categoriaFiltro();
    const rar = this.rarezaFiltro();
    const orden = this.ordenSeleccionado();

    const filtrados = base.filter((nft) => {
      const okCat = cat === 'Todas' || nft.categoria === cat;
      const okRar = rar === 'Todas' || nft.rareza === rar;
      return okCat && okRar;
    });

    // Clase 07: Ordenamiento interno por precio utilizando BinaryTree.inOrder()
    if (orden === 'precio_asc') {
      return this.catalog.ordenarPorPrecioConBST(filtrados, 'asc');
    }
    if (orden === 'precio_desc') {
      return this.catalog.ordenarPorPrecioConBST(filtrados, 'desc');
    }
    if (orden === 'popularidad') {
      return [...filtrados].sort((a, b) => b.popularidad - a.popularidad);
    }
    return filtrados;
  });

  constructor() {
    effect(() => {
      const query = (this.q() ?? '').trim();
      const catParam = (this.cat() ?? '').trim();
      const nextCat: GifCategory | 'Todas' =
        catParam && GIF_CATEGORIES.includes(catParam as GifCategory)
          ? (catParam as GifCategory)
          : 'Todas';

      this.categoriaFiltro.set(nextCat);

      if (query === this.ultimoQueryDeUrl && nextCat === this.ultimaCatDeUrl) {
        return;
      }

      this.ultimoQueryDeUrl = query;
      this.ultimaCatDeUrl = nextCat;

      if (query) {
        this.terminoBusqueda.set(query);
        void this.ejecutarBusqueda(query);
      } else {
        this.cancelarTemporizador();
        this.solicitudActualId++;
        this.giphyHook.cancelar();
        this.terminoBusqueda.set('');
        this.resultadosBusqueda.set(null);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.catalog.inicializarCatalogo();
  }

  ngOnDestroy(): void {
    this.cancelarTemporizador();
    this.solicitudActualId++;
    this.giphyHook.cancelar();
  }

  private cancelarTemporizador(): void {
    if (this.temporizador) {
      clearTimeout(this.temporizador);
      this.temporizador = undefined;
    }
  }

  private sincronizarUrl(query: string, replaceUrl: boolean): void {
    const queryParams: Record<string, string | null> = {
      q: query ? query : null,
      cat: this.categoriaFiltro() !== 'Todas' ? this.categoriaFiltro() : null,
    };
    void this.router.navigate(['/catalogo'], { queryParams, replaceUrl });
  }

  // Clase 13 (13-API): Búsqueda en vivo al escribir con debounce de 400 ms y cancelación AbortController
  alEscribir(event: Event): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value;
    this.terminoBusqueda.set(valor);

    this.cancelarTemporizador();

    this.temporizador = setTimeout(() => {
      const query = valor.trim();
      this.ultimoQueryDeUrl = query;
      this.ultimaCatDeUrl = this.categoriaFiltro();

      if (query.length > 0) {
        this.sincronizarUrl(query, true);
        void this.ejecutarBusqueda(query);
      } else {
        this.solicitudActualId++;
        this.giphyHook.cancelar();
        this.resultadosBusqueda.set(null);
        this.sincronizarUrl('', true);
      }
    }, 400);
  }

  async ejecutarBusqueda(query?: string): Promise<void> {
    const q = (query ?? this.terminoBusqueda()).trim();
    if (!q) {
      this.solicitudActualId++;
      this.giphyHook.cancelar();
      this.resultadosBusqueda.set(null);
      return;
    }

    const solicitudId = ++this.solicitudActualId;
    const cat =
      this.categoriaFiltro() === 'Todas' ? undefined : (this.categoriaFiltro() as GifCategory);
    const items = await this.giphyHook.buscar(q, 'fetch', cat);

    if (solicitudId !== this.solicitudActualId || this.terminoBusqueda().trim() !== q) {
      return;
    }

    this.resultadosBusqueda.set(items);
  }

  buscarSugerencia(sugerencia: string): void {
    this.terminoBusqueda.set(sugerencia);
    this.cancelarTemporizador();
    const query = sugerencia.trim();
    if (!query) return;

    this.ultimoQueryDeUrl = query;
    this.ultimaCatDeUrl = this.categoriaFiltro();
    this.sincronizarUrl(query, true);
    void this.ejecutarBusqueda(query);
  }

  onBuscarSubmit(): void {
    this.cancelarTemporizador();
    const q = this.terminoBusqueda().trim();
    this.ultimoQueryDeUrl = q;
    this.ultimaCatDeUrl = this.categoriaFiltro();

    if (q) {
      this.sincronizarUrl(q, true);
      void this.ejecutarBusqueda(q);
    } else {
      this.solicitudActualId++;
      this.giphyHook.cancelar();
      this.resultadosBusqueda.set(null);
      this.sincronizarUrl('', true);
    }
  }

  limpiarBusqueda(): void {
    this.cancelarTemporizador();
    this.solicitudActualId++;
    this.giphyHook.cancelar();
    this.terminoBusqueda.set('');
    this.resultadosBusqueda.set(null);
    this.ultimoQueryDeUrl = '';
    this.ultimaCatDeUrl = this.categoriaFiltro();
    this.sincronizarUrl('', true);
  }

  cambiarCategoria(valor: GifCategory | 'Todas'): void {
    this.categoriaFiltro.set(valor);
    this.cancelarTemporizador();
    const q = this.terminoBusqueda().trim();
    this.ultimoQueryDeUrl = q;
    this.ultimaCatDeUrl = valor;
    this.sincronizarUrl(q, false);
    if (q) {
      void this.ejecutarBusqueda(q);
    }
  }

  limpiarFiltros(): void {
    this.cancelarTemporizador();
    this.solicitudActualId++;
    this.giphyHook.cancelar();
    this.terminoBusqueda.set('');
    this.categoriaFiltro.set('Todas');
    this.rarezaFiltro.set('Todas');
    this.ordenSeleccionado.set('relevancia');
    this.resultadosBusqueda.set(null);
    this.ultimoQueryDeUrl = '';
    this.ultimaCatDeUrl = 'Todas';
    void this.router.navigate(['/catalogo']);
  }

  onToggleFavorite(nft: GifNft): void {
    this.cart.alternarFavorito(nft);
  }

  onAddToCart(nft: GifNft): void {
    this.cart.agregar(nft);
  }

  onInspectNft(nft: GifNft): void {
    this.router.navigate(['/nft', nft.id]);
  }
}
