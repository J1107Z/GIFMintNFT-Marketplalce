import { Injectable, computed, inject, signal } from '@angular/core';
import { BinaryTree } from '../../data-structures/binary-tree';
import { CircularLinkedList } from '../../data-structures/circular-linked-list';
import { Graph } from '../../data-structures/graph';
import { CollectionNode } from '../../data-structures/graph-node';
import { MinHeap } from '../../data-structures/min-heap';
import { Trie, TrieEntry } from '../../data-structures/trie';
import {
  GifCategory,
  GifNft,
  summarizeCatalogAnalytics,
} from '../../models/gif-nft.model';
import { ApiStrategy, GiphyService } from './giphy.service';

export interface PopularNftHeapItem {
  name: string;
  popularity: number;
  nft: GifNft;
}

@Injectable({
  providedIn: 'root',
})
export class MarketCatalogService {
  private giphy = inject(GiphyService);

  readonly catalogo = signal<GifNft[]>([]);
  readonly cargandoInicial = signal<boolean>(true);
  readonly errorCarga = signal<string | null>(null);

  // Clase 03: Lista Circular Simple para el carrusel infinito de drops destacados en Home
  readonly circularDrops = new CircularLinkedList<GifNft>();
  readonly dropDestacadoActual = signal<GifNft | null>(null);
  readonly totalDropsCirculares = signal<number>(0);

  // Clase 12: Trie para autocompletado instantáneo del buscador
  readonly searchTrie = new Trie<GifNft>();
  readonly totalPalabrasTrie = signal<number>(0);

  // Clase 11: Grafo interno de afinidad para calcular Productos Relacionados en /nft/:id
  readonly similarityGraph = new Graph();

  // Clase 12: MinHeap para mantener los Top K más populares
  readonly topKCount = signal<number>(4);
  readonly topPopulares = computed<GifNft[]>(() => {
    return this.obtenerTopKPopulares(this.topKCount());
  });

  // Resumen analítico demostrando métodos de array de Clase 01
  readonly resumenAnalitico = computed(() => summarizeCatalogAnalytics(this.catalogo()));

  private inicializado = false;
  private initPromise: Promise<void> | null = null;

  async inicializarCatalogo(): Promise<void> {
    if (this.inicializado && this.catalogo().length > 0) {
      return;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.cargandoInicial.set(true);
    this.errorCarga.set(null);

    this.initPromise = (async () => {
      try {
        const nfts = await this.giphy.cargarColeccionesIniciales();
        this.registrarNfts(nfts, true);
        this.inicializado = true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error cargando catálogo inicial';
        this.errorCarga.set(msg);
      } finally {
        this.cargandoInicial.set(false);
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  async buscarEnVivo(
    termino: string,
    metodo: ApiStrategy = 'fetch',
    categoria?: GifCategory
  ): Promise<GifNft[]> {
    const resultados = await this.giphy.buscar(termino, metodo, 20, categoria);
    if (resultados.length > 0) {
      this.registrarNfts(resultados, false);
    }
    return resultados;
  }

  async obtenerNftPorId(id: string): Promise<GifNft | null> {
    const existente = this.catalogo().find((n) => n.id === id);
    if (existente) {
      return existente;
    }

    const remoto = await this.giphy.obtenerPorId(id);
    if (remoto) {
      this.registrarNfts([remoto], false);
    }
    return remoto;
  }

  registrarNfts(nuevos: GifNft[], reconstruirCarrusel: boolean): void {
    const mapa = new Map<string, GifNft>();
    for (const item of this.catalogo()) {
      mapa.set(item.id, item);
    }

    const recienAgregados: GifNft[] = [];
    for (const item of nuevos) {
      // Nunca sobrescribe ni borra los productos base ya clasificados en el catálogo inicial
      if (!mapa.has(item.id)) {
        mapa.set(item.id, item);
        recienAgregados.push(item);
      }
    }

    const listaCompleta = Array.from(mapa.values());
    this.catalogo.set(listaCompleta);

    // Poblar Trie con títulos y categorías únicamente de los nuevos registros
    for (const nft of recienAgregados) {
      this.searchTrie.insert(nft.titulo, nft.popularidad, nft);
      this.searchTrie.insert(`${nft.categoria.toLowerCase()} ${nft.titulo}`, nft.popularidad, nft);
    }
    this.totalPalabrasTrie.set(this.searchTrie.getAllProducts().length);

    // Reconstruir Grafo de afinidad entre productos del catálogo
    this.reconstruirGrafoSimilitud(listaCompleta);

    if (reconstruirCarrusel || this.circularDrops.size() === 0) {
      this.circularDrops.clear();
      const destacados = this.obtenerTopKPopulares(6);
      const fuente = destacados.length > 0 ? destacados : listaCompleta.slice(0, 6);
      for (const drop of fuente) {
        this.circularDrops.append(drop);
      }
      this.totalDropsCirculares.set(this.circularDrops.size());
      this.dropDestacadoActual.set(this.circularDrops.getCurrent());
    }
  }

  // Clase 11: Conecta cada GifNft con productos afines (categoría, rareza/precio o creador)
  private reconstruirGrafoSimilitud(items: GifNft[]): void {
    this.similarityGraph.clear();

    for (const nft of items) {
      this.similarityGraph.addNode(new CollectionNode(nft.id, nft.categoria, nft.precio));
    }

    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        const mismaCategoria = a.categoria === b.categoria;
        const mismaRarezaYPrecio =
          a.rareza === b.rareza && Math.abs(a.precio - b.precio) <= 35;
        const mismoCreador =
          a.creador !== 'GIFMint Studio' && a.creador === b.creador;

        if (mismaCategoria || mismaRarezaYPrecio || mismoCreador) {
          this.similarityGraph.addEdge(a.id, b.id);
        }
      }
    }
  }

  // Clase 11: Obtiene hasta N productos relacionados consultando vecinos en el Graph (1er y 2do grado)
  obtenerProductosRelacionados(nftId: string, limite: number = 4): GifNft[] {
    const mapa = new Map<string, GifNft>();
    for (const item of this.catalogo()) {
      mapa.set(item.id, item);
    }

    const origen = mapa.get(nftId);
    if (!origen || !this.similarityGraph.searchNode(nftId)) {
      return [];
    }

    const visitados = new Set<string>([nftId]);
    const relacionados: GifNft[] = [];

    // 1er grado: vecinos directos en el grafo ordenados por cercanía de precio
    const vecinosDirectos = this.similarityGraph
      .getNeighbors(nftId)
      .map((n) => mapa.get(n.name))
      .filter((item): item is GifNft => item !== undefined)
      .sort((a, b) => {
        const scoreA =
          (a.categoria === origen.categoria ? 0 : 100) + Math.abs(a.precio - origen.precio);
        const scoreB =
          (b.categoria === origen.categoria ? 0 : 100) + Math.abs(b.precio - origen.precio);
        return scoreA - scoreB;
      });

    for (const vecino of vecinosDirectos) {
      if (relacionados.length >= limite) break;
      if (!visitados.has(vecino.id)) {
        visitados.add(vecino.id);
        relacionados.push(vecino);
      }
    }

    // 2do grado: si hay menos de 4, completar con vecinos de vecinos en el Graph
    if (relacionados.length < limite) {
      for (const vecino of vecinosDirectos) {
        if (relacionados.length >= limite) break;
        const segundoGrado = this.similarityGraph.getNeighbors(vecino.id);
        for (const sg of segundoGrado) {
          if (relacionados.length >= limite) break;
          if (!visitados.has(sg.name)) {
            const nftSg = mapa.get(sg.name);
            if (nftSg) {
              visitados.add(nftSg.id);
              relacionados.push(nftSg);
            }
          }
        }
      }
    }

    return relacionados;
  }

  // Clase 07: Ordenamiento interno por precio usando BinaryTree (BST) + recorrido inOrder
  ordenarPorPrecioConBST(items: GifNft[], direccion: 'asc' | 'desc'): GifNft[] {
    if (items.length <= 1) return [...items];

    const bst = new BinaryTree<GifNft>();
    for (const nft of items) {
      bst.insert(nft.precio, nft, nft.titulo);
    }

    const ordenadosAsc = bst.inOrderItems();
    return direccion === 'desc' ? [...ordenadosAsc].reverse() : ordenadosAsc;
  }

  siguienteDropCircular(): void {
    const siguiente = this.circularDrops.next();
    if (siguiente) {
      this.dropDestacadoActual.set(siguiente);
    }
  }

  anteriorDropCircular(): void {
    const anterior = this.circularDrops.prev();
    if (anterior) {
      this.dropDestacadoActual.set(anterior);
    }
  }

  // Clase 12: Autocompletado usando Trie.searchByPrefix + MinHeap.searchTopK
  autocompletar(prefijo: string, k: number = 6): TrieEntry<GifNft>[] {
    const clean = prefijo.trim().toLowerCase();
    if (!clean) return [];
    const top = this.searchTrie.searchTopK(clean, k);

    const vistos = new Set<string>();
    const filtrados: TrieEntry<GifNft>[] = [];
    for (const entry of top) {
      const nftId = entry.payload?.id ?? entry.name;
      if (!vistos.has(nftId)) {
        vistos.add(nftId);
        filtrados.push(entry);
      }
    }
    return filtrados;
  }

  // Clase 12: Algoritmo Top-K con MinHeap (mantiene tamaño K eliminando el menor)
  obtenerTopKPopulares(k: number = 4): GifNft[] {
    const items = this.catalogo();
    if (items.length === 0 || k <= 0) return [];

    const heap = new MinHeap<PopularNftHeapItem>();
    for (const nft of items) {
      heap.push({
        name: nft.titulo,
        popularity: nft.popularidad,
        nft,
      });
      if (heap.size() > k) {
        heap.pop();
      }
    }

    const top: GifNft[] = [];
    while (heap.size() > 0) {
      const popped = heap.pop();
      if (popped) {
        top.unshift(popped.nft);
      }
    }
    return top;
  }
}
