import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { DoublyLinkedList } from '../../data-structures/doubly-linked-list';
import { GifNft } from '../../models/gif-nft.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  private auth = inject(AuthService);

  // Clase 03: Lista Doblemente Enlazada para navegar Atrás / Siguiente en NFTs visitados
  readonly historialLista = new DoublyLinkedList<GifNft>();

  readonly historial = signal<GifNft[]>([]);
  readonly actual = signal<GifNft | null>(null);
  readonly puedeAtras = signal<boolean>(false);
  readonly puedeAdelante = signal<boolean>(false);

  private activeUserId: string | null | undefined = undefined;

  constructor() {
    effect(() => {
      const userId = this.auth.usuario()?.id ?? null;
      untracked(() => {
        if (this.activeUserId !== userId) {
          this.activeUserId = userId;
          this.limpiarHistorial();
        }
      });
    });
  }

  visitarNft(nft: GifNft): void {
    this.historialLista.visit(nft, (a, b) => a.id === b.id);
    this.actualizarEstado();
  }

  retroceder(): GifNft | null {
    const prev = this.historialLista.goBack();
    this.actualizarEstado();
    return prev;
  }

  avanzar(): GifNft | null {
    const next = this.historialLista.goForward();
    this.actualizarEstado();
    return next;
  }

  limpiarHistorial(): void {
    this.historialLista.clear();
    this.actualizarEstado();
  }

  private actualizarEstado(): void {
    this.historial.set(this.historialLista.toArray());
    this.actual.set(this.historialLista.getCurrent());
    this.puedeAtras.set(this.historialLista.canGoBack());
    this.puedeAdelante.set(this.historialLista.canGoForward());
  }
}
