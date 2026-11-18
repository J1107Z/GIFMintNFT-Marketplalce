import { TrieNode } from './trie-node';
import { HeapItem, MinHeap } from './min-heap';

export interface TrieEntry<T = unknown> extends HeapItem {
  payload?: T;
}

export class Trie<T = unknown> {
  root: TrieNode<T>;

  constructor() {
    this.root = new TrieNode<T>(null);
  }

  insert(word: string, popularity: number = 0, payload?: T): void {
    const cleanWord = word.toLowerCase().trim();
    if (!cleanWord) return;

    let current = this.root;

    for (const character of cleanWord) {
      if (current.children[character] === undefined) {
        current.children[character] = new TrieNode<T>(character);
      }

      current = current.children[character];
    }
    current.isEndOfWord = true;
    current.popularity = popularity;
    current.payload = payload;
  }

  search(word: string): boolean {
    const cleanWord = word.toLowerCase().trim();
    if (!cleanWord) return false;

    let current = this.root;
    for (const character of cleanWord) {
      if (current.children[character] === undefined) {
        return false;
      }
      current = current.children[character];
    }
    return current.isEndOfWord;
  }

  searchByPrefix(prefix: string): TrieEntry<T>[] {
    const cleanPrefix = prefix.toLowerCase().trim();
    let current = this.root;

    for (const character of cleanPrefix) {
      if (current.children[character] === undefined) {
        return [];
      }
      current = current.children[character];
    }

    const results: TrieEntry<T>[] = [];
    this.collectProducts(current, cleanPrefix, results);
    return results;
  }

  collectProducts(node: TrieNode<T>, currentWord: string, results: TrieEntry<T>[]): void {
    if (node.isEndOfWord) {
      results.push({
        name: currentWord,
        popularity: node.popularity,
        payload: node.payload,
      });
    }

    for (const character in node.children) {
      this.collectProducts(node.children[character], currentWord + character, results);
    }
  }

  searchTopK(prefix: string, k: number): TrieEntry<T>[] {
    if (k <= 0) return [];

    const matchedProducts = this.searchByPrefix(prefix);
    if (matchedProducts.length === 0) return [];

    const heap = new MinHeap<TrieEntry<T>>();

    for (const product of matchedProducts) {
      heap.push(product);
      if (heap.size() > k) {
        heap.pop();
      }
    }

    const topK: TrieEntry<T>[] = [];
    while (heap.size() > 0) {
      const minProduct = heap.pop();
      if (minProduct !== undefined) {
        topK.unshift(minProduct);
      }
    }

    return topK;
  }

  getAllProducts(): TrieEntry<T>[] {
    const results: TrieEntry<T>[] = [];
    this.collectProducts(this.root, '', results);
    return results;
  }

  clear(): void {
    this.root = new TrieNode<T>(null);
  }
}
