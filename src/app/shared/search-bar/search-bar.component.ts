import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrieEntry } from '../../data-structures/trie';
import { useGiphy } from '../../hooks/use-giphy';
import { GifNft } from '../../models/gif-nft.model';

@Component({
  selector: 'app-search-bar',
  imports: [FormsModule],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.scss',
})
export class SearchBarComponent implements OnChanges {
  private giphyHook = useGiphy();

  @Input() placeholder: string = 'Buscar GIF-NFTs, colecciones o creadores...';
  @Input() initialQuery: string = '';

  @Output() searchSubmitted = new EventEmitter<string>();
  @Output() suggestionSelected = new EventEmitter<TrieEntry<GifNft>>();

  termino = '';
  readonly enfocado = signal<boolean>(false);
  readonly sugerencias = signal<TrieEntry<GifNft>[]>([]);

  ngOnChanges(): void {
    if (this.initialQuery && !this.termino) {
      this.termino = this.initialQuery;
    }
  }

  onFocus(_event: FocusEvent): void {
    this.enfocado.set(true);
    this.actualizarSugerencias();
  }

  onBlur(_event: FocusEvent): void {
    setTimeout(() => {
      this.enfocado.set(false);
    }, 180);
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.termino = val;
    this.actualizarSugerencias();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.enfocado.set(false);
    }
  }

  private actualizarSugerencias(): void {
    const q = this.termino.trim();
    if (!q) {
      this.sugerencias.set([]);
      return;
    }
    const matches = this.giphyHook.autocompletar(q, 6);
    this.sugerencias.set(matches);
  }

  onSubmit(): void {
    const query = this.termino.trim();
    if (!query) return;
    this.enfocado.set(false);
    this.searchSubmitted.emit(query);
  }

  elegirSugerencia(item: TrieEntry<GifNft>): void {
    this.termino = item.payload?.titulo ?? item.name;
    this.enfocado.set(false);
    this.suggestionSelected.emit(item);
  }
}
