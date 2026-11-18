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

  terminoBusqueda = '';
  readonly categoriaFiltro = signal<GifCategory | 'Todas'>('Todas');
  readonly rarezaFiltro = signal<GifRarity | 'Todas'>('Todas');
  readonly ordenSeleccionado = signal<SortOption>('relevancia');
  readonly resultadosBusqueda = signal<GifNft[] | null>(null);

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

      if (catParam && GIF_CATEGORIES.includes(catParam as GifCategory)) {
        this.categoriaFiltro.set(catParam as GifCategory);
      } else if (!catParam) {
        this.categoriaFiltro.set('Todas');
      }

      if (query) {
        this.terminoBusqueda = query;
        void this.ejecutarBusqueda(query);
      } else {
        this.resultadosBusqueda.set(null);
      }
    });
  }

  async ngOnInit(): Promise<void> {
    await this.catalog.inicializarCatalogo();
  }

  ngOnDestroy(): void {
    this.giphyHook.cancelar();
  }

  async ejecutarBusqueda(query?: string): Promise<void> {
    const q = (query ?? this.terminoBusqueda).trim();
    if (!q) {
      this.resultadosBusqueda.set(null);
      return;
    }

    const cat =
      this.categoriaFiltro() === 'Todas' ? undefined : (this.categoriaFiltro() as GifCategory);
    const items = await this.giphyHook.buscar(q, 'fetch', cat);
    this.resultadosBusqueda.set(items);
  }

  onBuscarSubmit(): void {
    const q = this.terminoBusqueda.trim();
    const cat = this.categoriaFiltro();
    const queryParams: Record<string, string> = {};
    if (q) queryParams['q'] = q;
    if (cat !== 'Todas') queryParams['cat'] = cat;
    this.router.navigate(['/catalogo'], { queryParams });
  }

  cambiarCategoria(valor: GifCategory | 'Todas'): void {
    this.categoriaFiltro.set(valor);
    const q = this.terminoBusqueda.trim();
    const queryParams: Record<string, string> = {};
    if (q) queryParams['q'] = q;
    if (valor !== 'Todas') queryParams['cat'] = valor;
    this.router.navigate(['/catalogo'], { queryParams });
  }

  limpiarFiltros(): void {
    this.terminoBusqueda = '';
    this.categoriaFiltro.set('Todas');
    this.rarezaFiltro.set('Todas');
    this.ordenSeleccionado.set('relevancia');
    this.resultadosBusqueda.set(null);
    this.router.navigate(['/catalogo']);
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
