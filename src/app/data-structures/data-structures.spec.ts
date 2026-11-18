import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { BinaryTree } from './binary-tree';
import { CircularLinkedList } from './circular-linked-list';
import { DoublyLinkedList } from './doubly-linked-list';
import { Graph } from './graph';
import { CreatorNode, HubNode } from './graph-node';
import { LinkedList } from './linked-list';
import { MinHeap } from './min-heap';
import { NaryTree } from './nary-tree';
import { Queue } from './queue';
import { Stack } from './stack';
import { Trie } from './trie';
import {
  GIF_CATEGORIES,
  GifCategory,
  GifNft,
  enrichGifToNft,
  inferCategoryFromGif,
  summarizeCatalogAnalytics,
} from '../models/gif-nft.model';
import { AuthService } from '../core/services/auth.service';
import { CartService } from '../core/services/cart.service';
import { GiphyService } from '../core/services/giphy.service';
import { MarketCatalogService } from '../core/services/market-catalog.service';

describe('Estructuras de Datos y Modelo GIF-NFT', () => {
  it('LinkedList: append, peek, remove y toArray', () => {
    const list = new LinkedList<string>();
    list.append('NFT-1');
    list.append('NFT-2');
    list.append('NFT-3');
    expect(list.size()).toBe(3);
    expect(list.peek('NFT-2')?.value).toBe('NFT-2');
    expect(list.remove('NFT-2')).toBe(true);
    expect(list.toArray()).toEqual(['NFT-1', 'NFT-3']);
  });

  it('DoublyLinkedList: navegación Atrás y Siguiente', () => {
    const history = new DoublyLinkedList<string>();
    history.visit('A');
    history.visit('B');
    history.visit('C');
    expect(history.getCurrent()).toBe('C');
    expect(history.goBack()).toBe('B');
    expect(history.goBack()).toBe('A');
    expect(history.canGoBack()).toBe(false);
    expect(history.goForward()).toBe('B');
  });

  it('CircularLinkedList: rotación circular infinita', () => {
    const circular = new CircularLinkedList<number>();
    circular.append(1);
    circular.append(2);
    circular.append(3);
    expect(circular.getCurrent()).toBe(1);
    expect(circular.next()).toBe(2);
    expect(circular.next()).toBe(3);
    expect(circular.next()).toBe(1);
    expect(circular.prev()).toBe(3);
  });

  it('Stack (LIFO): push, peek y pop', () => {
    const stack = new Stack<string>();
    stack.push('ADD');
    stack.push('REMOVE');
    expect(stack.peek()).toBe('REMOVE');
    expect(stack.pop()).toBe('REMOVE');
    expect(stack.pop()).toBe('ADD');
    expect(stack.isEmpty()).toBe(true);
  });

  it('Queue (FIFO): enqueue, peek y dequeue en orden de llegada', () => {
    const queue = new Queue<string>();
    queue.enqueue('Orden-1');
    queue.enqueue('Orden-2');
    expect(queue.peek()).toBe('Orden-1');
    expect(queue.dequeue()).toBe('Orden-1');
    expect(queue.dequeue()).toBe('Orden-2');
    expect(queue.isEmpty()).toBe(true);
  });

  it('BinaryTree (BST): insert, search, isLeaf, inOrder, preOrder, postOrder y D3', () => {
    const bst = new BinaryTree<string>();
    bst.insertSeries([50, 30, 70, 20, 40]);
    expect(bst.inOrder()).toEqual([20, 30, 40, 50, 70]);
    expect(bst.preOrder()).toEqual([50, 30, 20, 40, 70]);
    expect(bst.postOrder()).toEqual([20, 40, 30, 70, 50]);
    expect(bst.search(40)).toBe(true);
    expect(bst.searchNode(20)?.isLeaf()).toBe(true);
    expect(bst.toD3Hierarchy()?.value).toBe(50);
  });

  it('NaryTree: addChild, dfs y bfs', () => {
    const tree = new NaryTree<string>('Root');
    const c1 = tree.root!.addChild('Explorar');
    c1.addChild('Catálogo');
    tree.root!.addChild('Admin');

    const dfsOrder: string[] = [];
    tree.dfs((n) => dfsOrder.push(n.value));
    expect(dfsOrder).toEqual(['Root', 'Explorar', 'Catálogo', 'Admin']);

    const bfsOrder: string[] = [];
    tree.bfs((n) => bfsOrder.push(n.value));
    expect(bfsOrder).toEqual(['Root', 'Explorar', 'Admin', 'Catálogo']);
  });

  it('Graph: addNode, addEdge, searchNode y removeNode', () => {
    const graph = new Graph();
    graph.addNode(new HubNode('HubA', 'Cali'));
    graph.addNode(new CreatorNode('Creator1', '3D'));
    expect(graph.addEdge('HubA', 'Creator1')).toBe(true);
    expect(graph.adjList['HubA']).toContain('Creator1');
    expect(graph.removeNode('Creator1')).toBe(true);
    expect(graph.adjList['HubA']).toEqual([]);
  });

  it('Trie y MinHeap: insert, searchByPrefix y searchTopK', () => {
    const trie = new Trie();
    trie.insert('cyberpunk alpha', 90);
    trie.insert('cyberpunk omega', 98);
    trie.insert('cyberpunk beta', 82);
    trie.insert('anime loop', 95);

    const top2 = trie.searchTopK('cyberpunk', 2);
    expect(top2.map((t) => t.name)).toEqual(['cyberpunk omega', 'cyberpunk alpha']);

    const heap = new MinHeap([
      { name: 'a', popularity: 30 },
      { name: 'b', popularity: 10 },
      { name: 'c', popularity: 20 },
    ]);
    expect(heap.pop()?.popularity).toBe(10);
  });

  it('Clase 01 Enriquecimiento determinístico GIF-NFT y analytics', () => {
    const nft = enrichGifToNft({
      id: 'abc123xyz',
      title: 'Cyberpunk Neon City',
      url: 'https://giphy.com/test',
      images: {
        fixed_height: { url: 'https://media.giphy.com/200.gif' },
        original: { url: 'https://media.giphy.com/giphy.gif' },
      },
    });
    expect(nft.categoria).toBe('Cyberpunk');
    expect(nft.precio).toBeGreaterThanOrEqual(12);
    expect(nft.precio).toBeLessThanOrEqual(240);

    const summary = summarizeCatalogAnalytics([nft]);
    expect(summary.totalCount).toBe(1);
    expect(summary.allValidPrices).toBe(true);
  });

  it('BinaryTree.inOrderItems conserva duplicados de precio y ordena ascendente', () => {
    const bst = new BinaryTree<{ id: string; precio: number }>();
    expect(bst.insert(50, { id: 'A', precio: 50 }, 'A')).toBe(true);
    expect(bst.insert(20, { id: 'B', precio: 20 }, 'B')).toBe(true);
    // Segundo elemento con el mismo precio ($50): insert retorna false pero acumula data en el nodo
    expect(bst.insert(50, { id: 'C', precio: 50 }, 'C')).toBe(false);
    expect(bst.insert(90, { id: 'D', precio: 90 }, 'D')).toBe(true);

    const ordenados = bst.inOrderItems();
    expect(ordenados.map((x) => x.id)).toEqual(['B', 'A', 'C', 'D']);
  });

  it('MarketCatalogService: ordena por precio via BST y obtiene hasta 4 relacionados via Graph', () => {
    TestBed.configureTestingModule({
      providers: [
        MarketCatalogService,
        { provide: GiphyService, useValue: {} },
      ],
    });
    const catalog = TestBed.inject(MarketCatalogService);

    const makeNft = (
      id: string,
      precio: number,
      categoria: GifNft['categoria'],
      rareza: GifNft['rareza'],
      creador: string
    ): GifNft => ({
      id,
      titulo: `NFT ${id}`,
      gifUrl: `https://example.com/${id}.gif`,
      previewUrl: `https://example.com/${id}-sm.gif`,
      creador,
      precio,
      precioEth: Number((precio * 0.00031).toFixed(4)),
      rareza,
      edicion: '#1/10',
      categoria,
      popularidad: 80,
      tokenHash: `0x${id}abcd`,
      red: 'Ethereum Sepolia L2',
    });

    const items: GifNft[] = [
      makeNft('n1', 120, 'Cyberpunk', 'Raro', 'CyberLab'),
      makeNft('n2', 45, 'Cyberpunk', 'Común', 'PixelForge'),
      makeNft('n3', 200, 'Cyberpunk', 'Épico', 'NeonCraft'),
      makeNft('n4', 95, 'Anime', 'Raro', 'OtakuStudio'),
      // n5 comparte creador con n4 (2do grado respecto a n1 via n4)
      makeNft('n5', 150, 'Gaming', 'Legendario', 'OtakuStudio'),
    ];

    catalog.registrarNfts(items, true);

    const asc = catalog.ordenarPorPrecioConBST(items, 'asc');
    expect(asc.map((i) => i.id)).toEqual(['n2', 'n4', 'n1', 'n5', 'n3']);

    const desc = catalog.ordenarPorPrecioConBST(items, 'desc');
    expect(desc.map((i) => i.id)).toEqual(['n3', 'n5', 'n1', 'n4', 'n2']);

    const relacionados = catalog.obtenerProductosRelacionados('n1', 4);
    expect(relacionados.length).toBe(4);
    expect(relacionados.some((r) => r.id === 'n1')).toBe(false);
    // n2 y n3 tienen misma categoría que n1, n4 misma rareza y precio cercano (<=35), n5 entra por 2do grado via n4
    expect(relacionados.map((r) => r.id)).toContain('n2');
    expect(relacionados.map((r) => r.id)).toContain('n3');
    expect(relacionados.map((r) => r.id)).toContain('n4');
    expect(relacionados.map((r) => r.id)).toContain('n5');
  });

  it('CartService: aisla carrito y favoritos por usuario autenticado', () => {
    localStorage.clear();
    const userSignal = signal<{ id: string } | null>({ id: 'user-cliente' });

    TestBed.configureTestingModule({
      providers: [
        CartService,
        { provide: AuthService, useValue: { usuario: userSignal } },
      ],
    });

    const cart = TestBed.inject(CartService);
    const nftCliente = enrichGifToNft(
      {
        id: 'gif-cli-1',
        title: 'Cliente Drop',
        url: 'https://giphy.com/cli',
        images: {
          fixed_height: { url: 'https://media.giphy.com/cli-sm.gif' },
          original: { url: 'https://media.giphy.com/cli.gif' },
        },
      },
      'Cyberpunk'
    );

    cart.cambiarPropietario('user-cliente');
    cart.agregar(nftCliente);
    cart.alternarFavorito(nftCliente);
    expect(cart.items().length).toBe(1);
    expect(cart.favoritos().length).toBe(1);

    // Cambiar a usuario admin debe limpiar memoria y cargar colección independiente vacía
    cart.cambiarPropietario('user-admin');
    expect(cart.items().length).toBe(0);
    expect(cart.favoritos().length).toBe(0);

    // Volver al cliente debe restaurar únicamente su propia colección
    cart.cambiarPropietario('user-cliente');
    expect(cart.items().length).toBe(1);
    expect(cart.favoritos().length).toBe(1);

    localStorage.clear();
  });

  it('Clasificación semántica precisa de categorías usando title, slug y username', () => {
    const mkRaw = (id: string, title: string, slug: string = '', username: string = '') => ({
      id,
      title,
      slug,
      username,
      url: `https://giphy.com/${id}`,
      images: {
        fixed_height: { url: `https://media.giphy.com/${id}-sm.gif` },
        original: { url: `https://media.giphy.com/${id}.gif` },
      },
    });

    // Casos reportados explícitos
    expect(
      enrichGifToNft(
        mkRaw('pp1', 'Pedro Pascal Laughing GIF by Crafture', 'pedro-pascal-laughing-pp1', 'crafture')
      ).categoria
    ).toBe('Memes');

    expect(
      enrichGifToNft(mkRaw('bw1', 'Bored Still Waiting GIF', 'bored-still-waiting-bw1')).categoria
    ).toBe('Reacciones');

    expect(
      enrichGifToNft(mkRaw('tc1', 'Tired Coffee GIF', 'tired-coffee-tc1')).categoria
    ).toBe('Reacciones');

    expect(
      enrichGifToNft(
        mkRaw('gta1', 'Waiting GIF', 'gta-vi-rockstar-waiting-gta1', 'rockstargames')
      ).categoria
    ).toBe('Gaming');

    // No contaminar Arte 3D cuando el ID aleatorio del slug contiene "3d" ni Gaming por "instagram"
    expect(
      inferCategoryFromGif('Funny Viral Dance', 1, undefined, 'lunch-instagram-meme-abc3d', '', 'abc3d')
    ).toBe('Memes');

    // Fallback neutro sin coincidencias nunca cae en Gaming o Anime
    const neutro = inferCategoryFromGif('Sunset Ocean Breeze', 3, undefined, 'sunset-ocean-breeze-1', '', '1');
    expect(['Reacciones', 'Memes']).toContain(neutro);

    // Reclasifica aunque venga categoriaForzada distinta cuando hay señal semántica clara
    expect(
      enrichGifToNft(mkRaw('gta2', 'Waiting GIF', 'waiting-gta-vi-gta2'), 'Anime').categoria
    ).toBe('Gaming');
  });

  it('MarketCatalogService.registrarNfts no sobrescribe productos base existentes en el catálogo', () => {
    TestBed.configureTestingModule({
      providers: [MarketCatalogService, { provide: GiphyService, useValue: {} }],
    });
    const catalog = TestBed.inject(MarketCatalogService);

    const baseItem: GifNft = {
      id: 'base-1',
      titulo: 'Pedro Pascal Meme',
      gifUrl: 'https://example.com/1.gif',
      previewUrl: 'https://example.com/1-sm.gif',
      creador: 'crafture',
      precio: 40,
      precioEth: 0.0133,
      rareza: 'Raro',
      edicion: '#01/35',
      categoria: 'Memes',
      popularidad: 90,
      tokenHash: '0x111111a9f',
      red: 'Ethereum Sepolia L2',
    };

    catalog.registrarNfts([baseItem], true);
    expect(catalog.catalogo().find((n) => n.id === 'base-1')?.categoria).toBe('Memes');

    // Búsqueda posterior que devuelve el mismo ID con otra categoría forzada no debe alterarlo
    catalog.registrarNfts([{ ...baseItem, categoria: 'Cyberpunk' }], false);
    expect(catalog.catalogo().length).toBe(1);
    expect(catalog.catalogo().find((n) => n.id === 'base-1')?.categoria).toBe('Memes');
  });

  it('GiphyService.cargarColeccionesIniciales reúne 20 ítems únicos y coherentes en cada una de las 6 categorías', async () => {
    const keywordByCat: Record<GifCategory, string> = {
      Cyberpunk: 'Cyberpunk Neon',
      Anime: 'Anime Manga',
      Gaming: 'Pixel Gaming',
      'Arte 3D': '3D Abstract Render',
      Memes: 'Funny Meme',
      Reacciones: 'Reaction Face',
    };

    const mkPool = (cat: GifCategory, count: number, offset: number = 0) =>
      Array.from({ length: count }, (_, idx) => {
        const id = `${cat.replace(/\s+/g, '')}-${offset + idx}`;
        return {
          id,
          title: `${keywordByCat[cat]} Drop #${offset + idx}`,
          slug: `${keywordByCat[cat].toLowerCase().replace(/\s+/g, '-')}-${id}`,
          username: 'creator',
          url: `https://giphy.com/${id}`,
          images: {
            fixed_height: { url: `https://media.giphy.com/${id}-sm.gif` },
            original: { url: `https://media.giphy.com/${id}.gif` },
          },
        };
      });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString();
      const q = decodeURIComponent(url.split('q=')[1]?.split('&')[0] ?? '').replace(/\+/g, ' ');

      let data: unknown[] = [];
      if (q.includes('cyberpunk')) data = mkPool('Cyberpunk', 25);
      else if (q.includes('anime')) data = mkPool('Anime', 25);
      else if (q.includes('gaming') || q.includes('video games')) data = mkPool('Gaming', 25);
      else if (q.includes('3d')) data = mkPool('Arte 3D', 25);
      else if (q.includes('meme')) data = mkPool('Memes', 25);
      else if (q === 'reaction face laughing bored tired') data = mkPool('Reacciones', 1, 0);
      else if (q.includes('reaction') || q.includes('bored')) data = mkPool('Reacciones', 25, 10);

      return {
        ok: true,
        status: 200,
        json: async () => ({ data, meta: { status: 200, msg: 'OK' } }),
      } as Response;
    });

    try {
      TestBed.configureTestingModule({
        providers: [provideHttpClient(), GiphyService],
      });
      const giphy = TestBed.inject(GiphyService);
      const catalogo = await giphy.cargarColeccionesIniciales();

      expect(catalogo.length).toBe(120);
      const uniqueIds = new Set(catalogo.map((n) => n.id));
      expect(uniqueIds.size).toBe(120);

      for (const cat of GIF_CATEGORIES) {
        const itemsCat = catalogo.filter((n) => n.categoria === cat);
        expect(itemsCat.length).toBe(20);
      }
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
