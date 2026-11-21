import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  signal,
  viewChild,
} from '@angular/core';
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
export class SearchBarComponent implements OnChanges, OnDestroy {
  private giphyHook = useGiphy();

  @Input() placeholder: string = 'Buscar GIF-NFTs, colecciones o creadores...';
  @Input() initialQuery: string = '';

  @Output() searchSubmitted = new EventEmitter<string>();
  @Output() searchCleared = new EventEmitter<void>();
  @Output() suggestionSelected = new EventEmitter<TrieEntry<GifNft>>();

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  termino = '';
  readonly enfocado = signal<boolean>(false);
  readonly sugerencias = signal<TrieEntry<GifNft>[]>([]);

  private temporizador?: ReturnType<typeof setTimeout>;
  private blurTimer?: ReturnType<typeof setTimeout>;

  ngOnChanges(): void {
    if (this.initialQuery && !this.termino) {
      this.termino = this.initialQuery;
    }
  }

  ngOnDestroy(): void {
    this.cancelarTemporizador();
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
    }
  }

  private cancelarTemporizador(): void {
    if (this.temporizador) {
      clearTimeout(this.temporizador);
      this.temporizador = undefined;
    }
  }

  onFocus(_event: FocusEvent): void {
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
      this.blurTimer = undefined;
    }
    this.enfocado.set(true);
    this.actualizarSugerencias();
  }

  onBlur(_event: FocusEvent): void {
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
    }
    this.blurTimer = setTimeout(() => {
      this.enfocado.set(false);
    }, 180);
  }

  onInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.termino = val;
    this.actualizarSugerencias();

    this.cancelarTemporizador();
    this.temporizador = setTimeout(() => {
      const query = val.trim();
      if (query.length > 0) {
        this.searchSubmitted.emit(query);
      } else {
        this.searchCleared.emit();
      }
    }, 450);
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

  limpiar(): void {
    this.cancelarTemporizador();
    this.termino = '';
    this.sugerencias.set([]);
    this.searchCleared.emit();
    this.searchInput()?.nativeElement.focus();
  }

  onSubmit(): void {
    this.cancelarTemporizador();
    const query = this.termino.trim();
    if (!query) return;
    this.enfocado.set(false);
    this.searchSubmitted.emit(query);
  }

  elegirSugerencia(item: TrieEntry<GifNft>): void {
    this.cancelarTemporizador();
    this.termino = item.payload?.titulo ?? item.name;
    this.enfocado.set(false);
    this.suggestionSelected.emit(item);
  }
}
