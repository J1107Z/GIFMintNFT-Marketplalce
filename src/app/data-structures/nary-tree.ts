import { NaryTreeNode } from './nary-tree-node';

export class NaryTree<T> {
  root: NaryTreeNode<T> | null = null;

  constructor(rootValue?: T) {
    if (rootValue !== undefined) {
      this.root = new NaryTreeNode<T>(rootValue);
    }
  }

  dfs(
    callback: (node: NaryTreeNode<T>, depth: number) => void,
    node: NaryTreeNode<T> | null = this.root,
    depth: number = 0
  ): void {
    if (node === null) return;
    callback(node, depth);
    for (const child of node.children) {
      this.dfs(callback, child, depth + 1);
    }
  }

  bfs(callback: (node: NaryTreeNode<T>, level: number) => void): void {
    if (this.root === null) return;

    const queue: { node: NaryTreeNode<T>; level: number }[] = [
      { node: this.root, level: 0 },
    ];

    while (queue.length > 0) {
      const { node, level } = queue.shift()!;
      callback(node, level);
      for (const child of node.children) {
        queue.push({ node: child, level: level + 1 });
      }
    }
  }

  printDFS(labelFn: (val: T) => string = (val) => String(val)): void {
    console.log('=== Recorrido DFS del Árbol N-ario ===');
    this.dfs((node, depth) => {
      const indentation = '  '.repeat(depth);
      const prefix = depth === 0 ? '[Raíz] ' : '├── ';
      console.log(`${indentation}${prefix}${labelFn(node.value)}`);
    });
  }

  printBFS(labelFn: (val: T) => string = (val) => String(val)): void {
    console.log('=== Recorrido BFS del Árbol N-ario (Nivel por Nivel) ===');
    let currentLevel = -1;
    this.bfs((node, level) => {
      if (level !== currentLevel) {
        currentLevel = level;
        console.log(`-- Nivel ${level} --`);
      }
      console.log(`  ${labelFn(node.value)}`);
    });
  }

  size(node: NaryTreeNode<T> | null = this.root): number {
    if (node === null) return 0;
    let count = 1;
    for (const child of node.children) {
      count += this.size(child);
    }
    return count;
  }

  height(node: NaryTreeNode<T> | null = this.root): number {
    if (node === null) return 0;
    if (node.isLeaf()) return 1;

    let maxChildHeight = 0;
    for (const child of node.children) {
      const childH = this.height(child);
      if (childH > maxChildHeight) {
        maxChildHeight = childH;
      }
    }
    return maxChildHeight + 1;
  }

  find(predicate: (node: NaryTreeNode<T>) => boolean): NaryTreeNode<T> | null {
    let result: NaryTreeNode<T> | null = null;
    this.dfs((node) => {
      if (!result && predicate(node)) {
        result = node;
      }
    });
    return result;
  }
}
