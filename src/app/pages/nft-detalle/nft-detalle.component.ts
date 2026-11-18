import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { HistoryService } from '../../core/services/history.service';
import { MarketCatalogService } from '../../core/services/market-catalog.service';
import { GifNft } from '../../models/gif-nft.model';
import { GifCardComponent } from '../../shared/gif-card/gif-card.component';
import { LoaderComponent } from '../../shared/loader/loader.component';

@Component({
  selector: 'app-nft-detalle',
  imports: [RouterLink, LoaderComponent, GifCardComponent],
  templateUrl: './nft-detalle.component.html',
  styleUrl: './nft-detalle.component.scss',
})
export class NftDetalleComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private catalog = inject(MarketCatalogService);
  protected cart = inject(CartService);
  protected history = inject(HistoryService);

  // Clase 08: Inputs vinculados desde /nft/:id y ?tab=...
  id = input<string>('');
  tab = input<string>('resumen');

  readonly nftActual = signal<GifNft | null>(null);
  readonly cargando = signal<boolean>(true);
  readonly bloqueActual = signal<number>(6482190);
  readonly tabActiva = computed(() => {
    const t = this.tab();
    if (t === 'propiedades' || t === 'certificado') return t;
    return 'resumen';
  });

  // Clase 11: Productos relacionados calculados internamente mediante el Graph
  readonly productosRelacionados = computed<GifNft[]>(() => {
    const actual = this.nftActual();
    this.catalog.catalogo();
    if (!actual) return [];
    return this.catalog.obtenerProductosRelacionados(actual.id, 4);
  });

  private timerBloque?: ReturnType<typeof setInterval>;

  constructor() {
    effect(() => {
      const currentId = this.id();
      if (currentId) {
        void this.cargarNft(currentId);
      }
    });
  }

  ngOnInit(): void {
    this.timerBloque = setInterval(() => {
      this.bloqueActual.update((n) => n + 1);
    }, 3500);
  }

  ngOnDestroy(): void {
    if (this.timerBloque) {
      clearInterval(this.timerBloque);
    }
  }

  private async cargarNft(id: string): Promise<void> {
    this.cargando.set(true);
    try {
      await this.catalog.inicializarCatalogo();
      const encontrado = await this.catalog.obtenerNftPorId(id);
      this.nftActual.set(encontrado);
      if (encontrado) {
        this.history.visitarNft(encontrado);
      }
    } finally {
      this.cargando.set(false);
    }
  }

  irAtrasHistorial(): void {
    const prev = this.history.retroceder();
    if (prev) {
      this.router.navigate(['/nft', prev.id], { queryParams: { tab: this.tabActiva() } });
    }
  }

  irAdelanteHistorial(): void {
    const next = this.history.avanzar();
    if (next) {
      this.router.navigate(['/nft', next.id], { queryParams: { tab: this.tabActiva() } });
    }
  }

  onToggleFavorite(nft: GifNft): void {
    this.cart.alternarFavorito(nft);
  }

  onAddToCart(nft: GifNft): void {
    this.cart.agregar(nft);
  }

  onInspectRelated(nft: GifNft): void {
    this.router.navigate(['/nft', nft.id]);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
