import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { GifNft } from '../../models/gif-nft.model';

@Component({
  selector: 'app-gif-card',
  imports: [],
  templateUrl: './gif-card.component.html',
  styleUrl: './gif-card.component.scss',
})
export class GifCardComponent {
  // Clase 02: Comunicación Padre <-> Hijo mediante @Input y @Output EventEmitter
  @Input({ required: true }) nft!: GifNft;
  @Input() isFavorite: boolean = false;
  @Input() inCart: boolean = false;

  @Output() toggleFavorite = new EventEmitter<GifNft>();
  @Output() addToCart = new EventEmitter<GifNft>();
  @Output() inspectNft = new EventEmitter<GifNft>();

  readonly hovered = signal<boolean>(false);

  onMouseEnter(_event: MouseEvent): void {
    this.hovered.set(true);
  }

  onMouseLeave(_event: MouseEvent): void {
    this.hovered.set(false);
  }

  onToggleFavorite(event: Event): void {
    event.stopPropagation();
    this.toggleFavorite.emit(this.nft);
  }

  onAddToCart(event: Event): void {
    event.stopPropagation();
    this.addToCart.emit(this.nft);
  }

  onInspect(): void {
    this.inspectNft.emit(this.nft);
  }
}
