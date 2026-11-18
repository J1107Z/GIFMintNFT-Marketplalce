export class Stack<T> {
  private items: T[] = [];

  push(element: T): void {
    this.items.push(element);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.items[this.items.length - 1];
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }

  print(): void {
    console.log('=== Contenido de la Pila (Top a Fondo - LIFO) ===');
    for (let i = this.items.length - 1; i >= 0; i--) {
      console.log(`[Posición ${i}]`, this.items[i]);
    }
    if (this.isEmpty()) {
      console.log('(La pila está vacía)');
    }
  }

  toArrayFromTop(): T[] {
    return [...this.items].reverse();
  }

  toArray(): T[] {
    return [...this.items];
  }
}
