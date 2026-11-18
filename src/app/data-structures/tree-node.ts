export class TreeNode<T = unknown> {
  value: number;
  label?: string;
  data?: T;
  items: T[] = [];
  left: TreeNode<T> | null = null;
  right: TreeNode<T> | null = null;

  constructor(value: number, data?: T, label?: string) {
    this.value = value;
    this.data = data;
    this.label = label;
    if (data !== undefined) {
      this.items.push(data);
    }
  }

  isLeaf(): boolean {
    return this.left === null && this.right === null;
  }
}
