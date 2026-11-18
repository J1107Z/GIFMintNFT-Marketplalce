export class DoublyNode<T> {
  value: T;
  next: DoublyNode<T> | null;
  prev: DoublyNode<T> | null;

  constructor(value: T) {
    this.value = value;
    this.next = null;
    this.prev = null;
  }
}

export class DoublyLinkedList<T> {
  head: DoublyNode<T> | null;
  tail: DoublyNode<T> | null;
  current: DoublyNode<T> | null;
  length: number;

  constructor() {
    this.head = null;
    this.tail = null;
    this.current = null;
    this.length = 0;
  }

  append(value: T): void {
    const newNode = new DoublyNode<T>(value);

    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
      this.current = newNode;
      this.length = 1;
      return;
    }

    if (this.tail) {
      this.tail.next = newNode;
      newNode.prev = this.tail;
      this.tail = newNode;
      this.current = newNode;
      this.length++;
    }
  }

  // Navegación tipo historial de navegador: si está en medio, recorta futuro y avanza al nuevo nodo
  visit(value: T, isSame?: (a: T, b: T) => boolean): void {
    if (this.current && isSame && isSame(this.current.value, value)) {
      return;
    }

    if (this.current && this.current.next) {
      // Truncar rama forward como en historial real
      this.current.next.prev = null;
      this.current.next = null;
      this.tail = this.current;
      this.recalculateLength();
    }

    this.append(value);
  }

  canGoBack(): boolean {
    return this.current !== null && this.current.prev !== null;
  }

  canGoForward(): boolean {
    return this.current !== null && this.current.next !== null;
  }

  goBack(): T | null {
    if (this.current && this.current.prev) {
      this.current = this.current.prev;
      return this.current.value;
    }
    return null;
  }

  goForward(): T | null {
    if (this.current && this.current.next) {
      this.current = this.current.next;
      return this.current.value;
    }
    return null;
  }

  getCurrent(): T | null {
    return this.current ? this.current.value : null;
  }

  remove(value: T): DoublyNode<T> | null {
    if (!this.head) return null;

    let node: DoublyNode<T> | null = this.head;
    while (node) {
      if (node.value === value) {
        if (node === this.head) {
          this.head = node.next;
          if (this.head) {
            this.head.prev = null;
          }
        }
        if (node === this.tail) {
          this.tail = node.prev;
          if (this.tail) {
            this.tail.next = null;
          }
        }
        if (node.prev) {
          node.prev.next = node.next;
        }
        if (node.next) {
          node.next.prev = node.prev;
        }
        if (this.current === node) {
          this.current = node.prev ?? node.next;
        }

        this.length--;
        return node;
      }
      node = node.next;
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

  print(): void {
    let curr = this.head;
    let result = 'null <- ';
    while (curr) {
      const marker = curr === this.current ? '[*]' : '';
      result += `${marker}${JSON.stringify(curr.value)} <-> `;
      curr = curr.next;
    }
    console.log(`${result}null`);
  }

  toArray(): T[] {
    const elementos: T[] = [];
    let curr = this.head;
    while (curr) {
      elementos.push(curr.value);
      curr = curr.next;
    }
    return elementos;
  }

  private recalculateLength(): void {
    let count = 0;
    let curr = this.head;
    while (curr) {
      count++;
      curr = curr.next;
    }
    this.length = count;
  }
}
