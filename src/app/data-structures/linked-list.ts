import { Node } from './node';

export class LinkedList<T> {
  head: Node<T> | null;
  tail: Node<T> | null;
  length: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  append(value: T): void {
    const newNode = new Node<T>(value);

    if (!this.head) {
      this.head = newNode;
    } else if (this.tail) {
      this.tail.next = newNode;
    }

    this.tail = newNode;
    this.length++;
  }

  peek(value: T, current: Node<T> | null = this.head): Node<T> | null {
    while (current) {
      if (current.value === value) {
        return current;
      }
      current = current.next;
    }
    return null;
  }

  findBy(predicate: (value: T) => boolean): T | null {
    let current = this.head;
    while (current) {
      if (predicate(current.value)) {
        return current.value;
      }
      current = current.next;
    }
    return null;
  }

  size(): number {
    return this.length;
  }

  isEmpty(): boolean {
    return this.length === 0;
  }

  remove(value: T): boolean {
    return this.removeBy((item) => item === value);
  }

  removeBy(predicate: (value: T) => boolean): boolean {
    if (!this.head) return false;

    if (predicate(this.head.value)) {
      this.head = this.head.next;
      if (!this.head) {
        this.tail = null;
      }
      this.length--;
      return true;
    }

    let curr: Node<T> = this.head;
    while (curr.next && !predicate(curr.next.value)) {
      curr = curr.next;
    }

    if (curr.next) {
      curr.next = curr.next.next;
      if (!curr.next) {
        this.tail = curr;
      }
      this.length--;
      return true;
    }

    return false;
  }

  clear(): void {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  print(): void {
    let current = this.head;
    let result = '';
    while (current) {
      result += `${JSON.stringify(current.value)} -> `;
      current = current.next;
    }
    console.log(`${result}null`);
  }

  toArray(): T[] {
    const elementos: T[] = [];
    let current = this.head;
    while (current) {
      elementos.push(current.value);
      current = current.next;
    }
    return elementos;
  }
}
