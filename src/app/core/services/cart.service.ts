import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { LinkedList } from '../../data-structures/linked-list';
import { Stack } from '../../data-structures/stack';
import { GifNft, NFT_MARKET_PROTOCOL } from '../../models/gif-nft.model';
import { CartAction, CartItem } from '../../models/venta.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private auth = inject(AuthService);

  // Clase 03: LinkedList para almacenar los elementos del carrito
  readonly carritoLista = new LinkedList<CartItem>();

  // Clase 06: Stack (LIFO) para deshacer la última acción realizada en el carrito
  readonly accionesPila = new Stack<CartAction>();

  readonly items = signal<CartItem[]>([]);
  readonly historialPila = signal<CartAction[]>([]);
  readonly favoritos = signal<GifNft[]>([]);
  readonly ultimoMensaje = signal<string>('');

  readonly totalCantidad = computed(() =>
    this.items().reduce((acc, item) => acc + item.cantidad, 0)
  );

  readonly totalUsd = computed(() =>
    this.items().reduce((acc, item) => acc + item.nft.precio * item.cantidad, 0)
  );

  readonly totalEth = computed(() => NFT_MARKET_PROTOCOL.calculateEth(this.totalUsd()));

  readonly totalFavoritos = computed(() => this.favoritos().length);

  readonly puedeDeshacer = computed(() => this.historialPila().length > 0);

  private activeOwnerKey: string | null = null;

  constructor() {
    this.limpiarLlavesLegacy();

    // Aislamiento estricto por usuario: al cambiar de sesión, limpia memoria y carga los datos del usuario actual
    effect(() => {
      const userId = this.auth.usuario()?.id ?? null;
      untracked(() => this.cambiarPropietario(userId));
    });
  }

  private getOwnerKey(userId?: string | null): string {
    const id = userId !== undefined ? userId : this.auth.usuario()?.id ?? null;
    return id ? id : 'guest';
  }

  private cartKey(owner: string): string {
    return `gifmint_cart_${owner}`;
  }

  private favKey(owner: string): string {
    return `gifmint_favorites_${owner}`;
  }

  private limpiarLlavesLegacy(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem('gifmint_cart_items');
    localStorage.removeItem('gifmint_favorites');
  }

  cambiarPropietario(userId: string | null): void {
    const nextOwner = this.getOwnerKey(userId);
    if (this.activeOwnerKey === nextOwner) {
      return;
    }

    // Limpiar estructuras en memoria antes de cargar las del nuevo usuario
    this.carritoLista.clear();
    this.accionesPila.clear();
    this.items.set([]);
    this.historialPila.set([]);
    this.favoritos.set([]);
    this.ultimoMensaje.set('');

    this.activeOwnerKey = nextOwner;
    this.cargarDesdeStorage(nextOwner);
  }

  private cargarDesdeStorage(owner: string): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const savedCart = localStorage.getItem(this.cartKey(owner));
      if (savedCart) {
        const parsed = JSON.parse(savedCart) as CartItem[];
        for (const item of parsed) {
          this.carritoLista.append(item);
        }
        this.items.set(this.carritoLista.toArray());
      }

      const savedFavs = localStorage.getItem(this.favKey(owner));
      if (savedFavs) {
        this.favoritos.set(JSON.parse(savedFavs) as GifNft[]);
      }
    } catch {
      // Ignorar datos corruptos en localStorage
    }
  }

  private sincronizar(persistir = true): void {
    const arr = this.carritoLista.toArray();
    this.items.set(arr);
    this.historialPila.set(this.accionesPila.toArrayFromTop());

    if (persistir && typeof localStorage !== 'undefined') {
      const owner = this.activeOwnerKey ?? this.getOwnerKey();
      localStorage.setItem(this.cartKey(owner), JSON.stringify(arr));
    }
  }

  private clonarSnapshot(): CartItem[] {
    return this.carritoLista.toArray().map((item) => ({
      ...item,
      nft: { ...item.nft },
    }));
  }

  agregar(nft: GifNft): void {
    const snapshot = this.clonarSnapshot();
    const existente = this.carritoLista.findBy((i) => i.nft.id === nft.id);

    if (existente) {
      const cantidadPrevia = existente.cantidad;
      existente.cantidad += 1;
      this.accionesPila.push({
        tipo: 'INCREMENT',
        nft,
        cantidadPrevia,
        descripcion: `Se agregó +1 unidad de "${nft.titulo}".`,
        timestamp: new Date().toLocaleTimeString(),
        snapshot,
      });
      this.ultimoMensaje.set(`Cantidad actualizada para "${nft.titulo}".`);
    } else {
      this.carritoLista.append({
        nft: { ...nft },
        cantidad: 1,
        agregadoEn: new Date().toISOString(),
      });
      this.accionesPila.push({
        tipo: 'ADD',
        nft,
        cantidadPrevia: 0,
        descripcion: `"${nft.titulo}" agregado al carrito.`,
        timestamp: new Date().toLocaleTimeString(),
        snapshot,
      });
      this.ultimoMensaje.set(`"${nft.titulo}" agregado al carrito.`);
    }

    this.sincronizar();
  }

  cambiarCantidad(nftId: string, delta: number): void {
    const item = this.carritoLista.findBy((i) => i.nft.id === nftId);
    if (!item) return;

    const snapshot = this.clonarSnapshot();
    const cantidadPrevia = item.cantidad;
    const nueva = item.cantidad + delta;

    if (nueva <= 0) {
      this.carritoLista.removeBy((i) => i.nft.id === nftId);
      this.accionesPila.push({
        tipo: 'REMOVE',
        nft: item.nft,
        cantidadPrevia,
        descripcion: `"${item.nft.titulo}" retirado del carrito.`,
        timestamp: new Date().toLocaleTimeString(),
        snapshot,
      });
    } else {
      item.cantidad = nueva;
      this.accionesPila.push({
        tipo: delta > 0 ? 'INCREMENT' : 'DECREMENT',
        nft: item.nft,
        cantidadPrevia,
        descripcion: `Cantidad modificada en "${item.nft.titulo}".`,
        timestamp: new Date().toLocaleTimeString(),
        snapshot,
      });
    }

    this.sincronizar();
  }

  eliminar(nftId: string): void {
    const item = this.carritoLista.findBy((i) => i.nft.id === nftId);
    if (!item) return;

    const snapshot = this.clonarSnapshot();
    this.carritoLista.removeBy((i) => i.nft.id === nftId);
    this.accionesPila.push({
      tipo: 'REMOVE',
      nft: item.nft,
      cantidadPrevia: item.cantidad,
      descripcion: `Eliminado "${item.nft.titulo}" del carrito.`,
      timestamp: new Date().toLocaleTimeString(),
      snapshot,
    });

    this.ultimoMensaje.set(`"${item.nft.titulo}" eliminado del carrito.`);
    this.sincronizar();
  }

  // Clase 06: Deshacer última acción sacando el tope de la Pila (Stack.pop LIFO)
  deshacerUltimaAccion(): boolean {
    const ultimaAccion = this.accionesPila.pop();
    if (!ultimaAccion) {
      this.ultimoMensaje.set('No hay cambios recientes por deshacer.');
      return false;
    }

    this.carritoLista.clear();
    if (ultimaAccion.snapshot) {
      for (const item of ultimaAccion.snapshot) {
        this.carritoLista.append(item);
      }
    }

    this.ultimoMensaje.set(`Cambio deshecho: ${ultimaAccion.descripcion}`);
    this.sincronizar();
    return true;
  }

  vaciarCarrito(registrarEnPila = true): void {
    if (this.carritoLista.isEmpty()) return;

    if (registrarEnPila) {
      const snapshot = this.clonarSnapshot();
      const primerItem = this.carritoLista.head!.value;
      this.accionesPila.push({
        tipo: 'CLEAR',
        nft: primerItem.nft,
        cantidadPrevia: snapshot.length,
        descripcion: `Vaciado del carrito (${snapshot.length} productos).`,
        timestamp: new Date().toLocaleTimeString(),
        snapshot,
      });
    } else {
      this.accionesPila.clear();
    }

    this.carritoLista.clear();
    this.sincronizar();
  }

  estaEnCarrito(nftId: string): boolean {
    return this.carritoLista.findBy((i) => i.nft.id === nftId) !== null;
  }

  // Favoritos aislados por usuario
  esFavorito(nftId: string): boolean {
    return this.favoritos().some((f) => f.id === nftId);
  }

  alternarFavorito(nft: GifNft): void {
    const existe = this.esFavorito(nft.id);
    const nuevaLista = existe
      ? this.favoritos().filter((f) => f.id !== nft.id)
      : [{ ...nft }, ...this.favoritos()];

    this.favoritos.set(nuevaLista);
    if (typeof localStorage !== 'undefined') {
      const owner = this.activeOwnerKey ?? this.getOwnerKey();
      localStorage.setItem(this.favKey(owner), JSON.stringify(nuevaLista));
    }
  }

  limpiarFavoritos(): void {
    this.favoritos.set([]);
    if (typeof localStorage !== 'undefined') {
      const owner = this.activeOwnerKey ?? this.getOwnerKey();
      localStorage.removeItem(this.favKey(owner));
    }
  }
}
