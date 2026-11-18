export class TrieNode<T = unknown> {
  value: string | null;
  isEndOfWord: boolean;
  children: { [key: string]: TrieNode<T> };
  popularity: number;
  payload?: T;

  constructor(value: string | null) {
    this.value = value;
    this.isEndOfWord = false;
    this.children = {};
    this.popularity = 0;
  }
}
