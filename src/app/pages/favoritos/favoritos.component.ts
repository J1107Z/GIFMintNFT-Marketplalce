import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { GifNft } from '../../models/gif-nft.model';
import { GifCardComponent } from '../../shared/gif-card/gif-card.component';

@Component({
  selector: 'app-favoritos',
  imports: [RouterLink, GifCardComponent],
  templateUrl: './favoritos.component.html',
  styleUrl: './favoritos.component.scss',
})
export class FavoritosComponent {
  protected cart = inject(CartService);
  private router = inject(Router);

  agregarTodosAlCarrito(): void {
    for (const nft of this.cart.favoritos()) {
      this.cart.agregar(nft);
    }
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
