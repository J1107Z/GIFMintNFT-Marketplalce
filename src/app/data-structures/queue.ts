export class Queue<T> {
  private items: T[] = [];

  enqueue(element: T): void {
    this.items.push(element);
  }

  dequeue(): T | undefined {
    return this.items.shift();
  }

  peek(): T | undefined {
    if (this.isEmpty()) {
      return undefined;
    }
    return this.items[0];
  }

  size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  clear(): void {
    this.items = [];
  }

  print(): void {
    console.log('=== Contenido de la Cola (Frente al Final - FIFO) ===');
    for (let i = 0; i < this.items.length; i++) {
      console.log(`[Posición ${i + 1}]`, this.items[i]);
    }
    if (this.isEmpty()) {
      console.log('(La cola está vacía)');
    }
  }

  toArray(): T[] {
    return [...this.items];
  }
}
