import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { MarketCatalogService } from '../../core/services/market-catalog.service';
import { MintQueueService } from '../../core/services/mint-queue.service';
import { TrieEntry } from '../../data-structures/trie';
import { GifNft } from '../../models/gif-nft.model';
import { SearchBarComponent } from '../search-bar/search-bar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, SidebarComponent, SearchBarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit {
  private router = inject(Router);
  private catalog = inject(MarketCatalogService);
  protected auth = inject(AuthService);
  protected cart = inject(CartService);
  protected mintQueue = inject(MintQueueService);

  readonly mobileMenuOpen = signal<boolean>(false);

  async ngOnInit(): Promise<void> {
    await this.catalog.inicializarCatalogo();
  }

  onSearchSubmitted(query: string): void {
    this.router.navigate(['/catalogo'], { queryParams: { q: query } });
  }

  onSuggestionSelected(entry: TrieEntry<GifNft>): void {
    if (entry.payload) {
      this.router.navigate(['/nft', entry.payload.id]);
    } else {
      this.router.navigate(['/catalogo'], { queryParams: { q: entry.name } });
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  inicialUsuario(): string {
    return this.auth.nombreVisible().charAt(0).toUpperCase() || 'G';
  }
}
