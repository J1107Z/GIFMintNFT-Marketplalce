   # GIFMint Market — E-Commerce de Coleccionables GIF-NFT

Plataforma web **E-Commerce de Coleccionables GIF-NFT** construida con **Angular 21**, **TypeScript**, **SASS**, **Bootstrap 5**, **D3.js**, **Axios**, **Supabase** (Auth, PostgreSQL, RLS, Realtime, Storage) y la **API de GIPHY** en tiempo real.

Cada GIF obtenido desde GIPHY es enriquecido determinísticamente con atributos de coleccionable digital (`precio` en USD y ETH simbólico, `rareza`, `edición`, `categoría`, `popularidad` y `tokenHash`), permitiendo navegar, buscar con autocompletado inteligente, gestionar favoritos y carrito, procesar órdenes de minteo y operar un panel administrativo en tiempo real.

---

## Integrantes

- **Julian Andres Zapata Posada** — Código: **2240291**
- **Yeick Jacson Moreno Ruiz** — Código: **2240991**

---

## Enlaces del Proyecto

- **Propuesta Gráfica Definitiva:** [docs/propuesta-grafica.png](./docs/propuesta-grafica.png)
- **Aplicación Publicada en Vercel:** [https://gifmint-nft-marketplace.vercel.app](https://gifmint-nft-marketplace.vercel.app)

![Propuesta Gráfica Definitiva — GIFMint Market](./docs/propuesta-grafica.png)

---

## Estructuras de Datos Implementadas

| Estructura | Archivo | Uso Principal en la Plataforma |
|---|---|---|
| `LinkedList` | `src/app/data-structures/linked-list.ts` | Carrito de compras con recorrido de nodos en cadena |
| `DoublyLinkedList` | `src/app/data-structures/doubly-linked-list.ts` | Historial Atrás / Siguiente de GIF-NFTs visitados (`/nft/:id`) |
| `CircularLinkedList` | `src/app/data-structures/circular-linked-list.ts` | Carrusel infinito de drops destacados en Home (`/`) |
| `Stack` (LIFO) | `src/app/data-structures/stack.ts` | Botón "Deshacer última acción" en Carrito (`/carrito`) |
| `Queue` (FIFO) | `src/app/data-structures/queue.ts` | Cola de procesamiento y minteo de órdenes por llegada (`/cola-minteo`) |
| `BinaryTree` (BST) + D3 | `src/app/data-structures/binary-tree.ts` | Explorador de precios con recorridos In/Pre/Post-Order y `d3.tree` (`/arbol-precios`) |
| `NaryTree` | `src/app/data-structures/nary-tree.ts` | Sidebar jerárquico dinámico y árbol de categorías |
| `Graph` + D3-Force | `src/app/data-structures/graph.ts` | Mapa interactivo de Hubs, Creadores y Colecciones (`/mapa-red`) |
| `Trie` | `src/app/data-structures/trie.ts` | Autocompletado por prefijo en la barra de búsqueda |
| `MinHeap` | `src/app/data-structures/min-heap.ts` | Ranking Top-K más populares en Home y autocompletado |

---



## Ejecución Local

```bash
npm install
ng serve
```

Abre `http://localhost:4200/` en tu navegador.

