import { TreeNode } from './tree-node';

export interface D3TreeNode<T = unknown> {
  id: string;
  value?: number;
  label?: string;
  data?: T;
  isLeaf?: boolean;
  hidden?: boolean;
  children?: D3TreeNode<T>[];
}

export class BinaryTree<T = unknown> {
  root: TreeNode<T> | null = null;

  insert(value: number, data?: T, label?: string): boolean {
    const newNode = new TreeNode<T>(value, data, label);

    if (this.root === null) {
      this.root = newNode;
      return true;
    }

    let current = this.root;
    while (true) {
      if (value === current.value) {
        if (data !== undefined) {
          current.items.push(data);
        }
        return false; // No se permiten nodos duplicados en el BST
      }

      if (value < current.value) {
        if (current.left === null) {
          current.left = newNode;
          return true;
        }
        current = current.left;
      } else {
        if (current.right === null) {
          current.right = newNode;
          return true;
        }
        current = current.right;
      }
    }
  }

  insertSeries(values: number[]): { inserted: number[]; duplicates: number[] } {
    const inserted: number[] = [];
    const duplicates: number[] = [];

    for (const val of values) {
      if (this.insert(val)) {
        inserted.push(val);
      } else {
        duplicates.push(val);
      }
    }

    return { inserted, duplicates };
  }

  search(value: number): boolean {
    return this.searchNode(value) !== null;
  }

  searchNode(value: number): TreeNode<T> | null {
    let current = this.root;
    while (current !== null) {
      if (current.value === value) {
        return current;
      }
      if (value < current.value) {
        current = current.left;
      } else {
        current = current.right;
      }
    }
    return null;
  }

  searchPath(value: number): { found: boolean; path: number[]; node: TreeNode<T> | null } {
    const path: number[] = [];
    let current = this.root;

    while (current !== null) {
      path.push(current.value);
      if (current.value === value) {
        return { found: true, path, node: current };
      }
      if (value < current.value) {
        current = current.left;
      } else {
        current = current.right;
      }
    }

    return { found: false, path, node: null };
  }

  inOrder(node: TreeNode<T> | null = this.root, result: number[] = []): number[] {
    if (node !== null) {
      this.inOrder(node.left, result);
      result.push(node.value);
      this.inOrder(node.right, result);
    }
    return result;
  }

  inOrderItems(node: TreeNode<T> | null = this.root, result: T[] = []): T[] {
    if (node !== null) {
      this.inOrderItems(node.left, result);
      for (const item of node.items) {
        result.push(item);
      }
      this.inOrderItems(node.right, result);
    }
    return result;
  }

  preOrder(node: TreeNode<T> | null = this.root, result: number[] = []): number[] {
    if (node !== null) {
      result.push(node.value);
      this.preOrder(node.left, result);
      this.preOrder(node.right, result);
    }
    return result;
  }

  postOrder(node: TreeNode<T> | null = this.root, result: number[] = []): number[] {
    if (node !== null) {
      this.postOrder(node.left, result);
      this.postOrder(node.right, result);
      result.push(node.value);
    }
    return result;
  }

  printInOrder(): void {
    const values = this.inOrder();
    console.log('=== Recorrido In-Order (L-N-R) ===');
    console.log(values.length > 0 ? values.join(' -> ') : '(Árbol vacío)');
  }

  printPreOrder(): void {
    const values = this.preOrder();
    console.log('=== Recorrido Pre-Order (N-L-R) ===');
    console.log(values.length > 0 ? values.join(' -> ') : '(Árbol vacío)');
  }

  printPostOrder(): void {
    const values = this.postOrder();
    console.log('=== Recorrido Post-Order (L-R-N) ===');
    console.log(values.length > 0 ? values.join(' -> ') : '(Árbol vacío)');
  }

  printAll(): void {
    this.printInOrder();
    this.printPreOrder();
    this.printPostOrder();
  }

  getHeight(node: TreeNode<T> | null = this.root): number {
    if (node === null) {
      return 0;
    }
    const leftHeight = this.getHeight(node.left);
    const rightHeight = this.getHeight(node.right);
    return Math.max(leftHeight, rightHeight) + 1;
  }

  size(node: TreeNode<T> | null = this.root): number {
    if (node === null) {
      return 0;
    }
    return 1 + this.size(node.left) + this.size(node.right);
  }

  isEmpty(): boolean {
    return this.root === null;
  }

  clear(): void {
    this.root = null;
  }

  toD3Hierarchy(): D3TreeNode<T> | null {
    if (this.root === null) {
      return null;
    }

    const buildNode = (node: TreeNode<T> | null, pathId: string): D3TreeNode<T> | null => {
      if (!node) return null;

      const item: D3TreeNode<T> = {
        id: `${pathId}_${node.value}`,
        value: node.value,
        label: node.label,
        data: node.data,
        isLeaf: node.isLeaf(),
        hidden: false,
      };

      if (node.left !== null || node.right !== null) {
        item.children = [
          node.left
            ? buildNode(node.left, `${pathId}_L`)!
            : { id: `${pathId}_L_dummy`, hidden: true },
          node.right
            ? buildNode(node.right, `${pathId}_R`)!
            : { id: `${pathId}_R_dummy`, hidden: true },
        ];
      }

      return item;
    };

    return buildNode(this.root, 'root');
  }
}
