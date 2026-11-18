import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { MarketCatalogService } from '../../core/services/market-catalog.service';
import { MenuTreeService } from '../../core/services/menu-tree.service';
import { GifCategory, GifNft } from '../../models/gif-nft.model';
import { GifCardComponent } from '../../shared/gif-card/gif-card.component';
import { LoaderComponent } from '../../shared/loader/loader.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, GifCardComponent, LoaderComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
  protected catalog = inject(MarketCatalogService);
  protected cart = inject(CartService);
  private menuTree = inject(MenuTreeService);
  private router = inject(Router);

  readonly categoriaActiva = signal<GifCategory | 'Todos'>('Todos');
  readonly ramasCategorias = computed(
    () => this.menuTree.categoryTree.root?.children ?? []
  );

  readonly nftsFiltrados = computed<GifNft[]>(() => {
    const cat = this.categoriaActiva();
    const lista = this.catalog.catalogo();
    if (cat === 'Todos') {
      return lista.slice(0, 18);
    }
    return lista.filter((n) => n.categoria === cat);
  });

  private carouselTimer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.carouselTimer = setInterval(() => {
      if (this.catalog.circularDrops.size() > 1) {
        this.catalog.siguienteDropCircular();
      }
    }, 6000);
  }

  ngOnDestroy(): void {
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
    }
  }

  seleccionarCategoria(cat: GifCategory | 'Todos'): void {
    this.categoriaActiva.set(cat);
  }

  cambiarTopK(k: number): void {
    this.catalog.topKCount.set(k);
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
