export class NaryTreeNode<T> {
  value: T;
  children: NaryTreeNode<T>[] = [];
  expanded: boolean = true;

  constructor(value: T) {
    this.value = value;
  }

  addChild(child: NaryTreeNode<T> | T): NaryTreeNode<T> {
    const node = child instanceof NaryTreeNode ? child : new NaryTreeNode(child);
    this.children.push(node);
    return node;
  }

  isLeaf(): boolean {
    return this.children.length === 0;
  }

  toggleExpand(): void {
    this.expanded = !this.expanded;
  }
}
