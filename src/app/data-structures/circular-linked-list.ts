import { Node } from './node';

export class CircularLinkedList<T> {
  head: Node<T> | null = null;
  tail: Node<T> | null = null;
  current: Node<T> | null = null;
  length: number = 0;

  append(value: T): void {
    const newNode = new Node<T>(value);

    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
      newNode.next = this.head;
      this.current = newNode;
    } else if (this.tail) {
      this.tail.next = newNode;
      this.tail = newNode;
      this.tail.next = this.head;
    }

    this.length++;
  }

  next(): T | null {
    if (!this.current) return null;
    this.current = this.current.next ?? this.head;
    return this.current ? this.current.value : null;
  }

  prev(): T | null {
    if (!this.head || !this.current) return null;
    if (this.head === this.tail) return this.current.value;

    let pointer = this.head;
    while (pointer.next && pointer.next !== this.current) {
      pointer = pointer.next;
      if (pointer === this.head) break;
    }
    this.current = pointer;
    return this.current.value;
  }

  getCurrent(): T | null {
    return this.current ? this.current.value : null;
  }

  remove(predicate: (val: T) => boolean): Node<T> | null {
    if (!this.head || !this.tail) return null;

    if (this.head === this.tail && predicate(this.head.value)) {
      const removed = this.head;
      this.head = null;
      this.tail = null;
      this.current = null;
      this.length = 0;
      return removed;
    }

    if (predicate(this.head.value)) {
      const removed = this.head;
      this.head = this.head.next;
      this.tail.next = this.head;
      if (this.current === removed) {
        this.current = this.head;
      }
      this.length--;
      return removed;
    }

    let curr = this.head;
    while (curr.next && curr.next !== this.head && !predicate(curr.next.value)) {
      curr = curr.next;
    }

    if (curr.next && curr.next !== this.head && predicate(curr.next.value)) {
      const removed = curr.next;
      if (removed === this.tail) {
        this.tail = curr;
      }
      curr.next = removed.next;
      if (this.current === removed) {
        this.current = curr.next;
      }
      this.length--;
      return removed;
    }

    return null;
  }

  size(): number {
    return this.length;
  }

  clear(): void {
    this.head = null;
    this.tail = null;
    this.current = null;
    this.length = 0;
  }

  toArray(): T[] {
    const elementos: T[] = [];
    if (!this.head) return elementos;

    let curr = this.head;
    do {
      elementos.push(curr.value);
      curr = curr.next!;
    } while (curr !== this.head && curr !== null);

    return elementos;
  }

  print(): void {
    if (!this.head) {
      console.log('Lista circular vacía');
      return;
    }
    let curr = this.head;
    let result = '';
    do {
      result += `${JSON.stringify(curr.value)} -> `;
      curr = curr.next!;
    } while (curr !== this.head);
    console.log(`${result}(vuelve al inicio)`);
  }
}
