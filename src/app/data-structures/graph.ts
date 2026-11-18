import { GraphNode } from './graph-node';

export class Graph {
  nodes: GraphNode[];
  adjList: { [key: string]: string[] };

  constructor() {
    this.nodes = [];
    this.adjList = {};
  }

  addNode(node: GraphNode): boolean {
    if (!this.searchNode(node.name)) {
      this.nodes.push(node);
      this.adjList[node.name] = [];
      return true;
    }
    return false;
  }

  addEdge(node1: string, node2: string): boolean {
    if (!this.adjList[node1] || !this.adjList[node2] || node1 === node2) {
      return false;
    }

    if (!this.adjList[node1].includes(node2)) {
      this.adjList[node1].push(node2);
    }
    if (!this.adjList[node2].includes(node1)) {
      this.adjList[node2].push(node1);
    }
    return true;
  }

  searchNode(nodeName: string): GraphNode | undefined {
    if (!this.nodes.length) return undefined;
    return this.nodes.find((n) => n.name === nodeName);
  }

  printAdjacency(nodeName: string): string[] | undefined {
    if (this.searchNode(nodeName)) {
      console.log(`[Adyacencia de ${nodeName}]:`, this.adjList[nodeName]);
      return this.adjList[nodeName];
    }
    console.warn(`El nodo ${nodeName} no existe en el grafo.`);
    return undefined;
  }

  printGraph(): void {
    console.log('[Grafo - Lista de Adyacencia]:', this.adjList);
  }

  print(): void {
    this.printGraph();
  }

  isEmpty(): boolean {
    return this.nodes.length === 0;
  }

  removeNode(nodeName: string): boolean {
    if (!this.searchNode(nodeName)) return false;

    const neighbors = [...(this.adjList[nodeName] || [])];
    for (const neighbor of neighbors) {
      this.removeEdge(nodeName, neighbor);
    }

    delete this.adjList[nodeName];
    this.nodes = this.nodes.filter((n) => n.name !== nodeName);
    return true;
  }

  removeEdge(node1: string, node2: string): void {
    if (this.adjList[node1]) {
      this.adjList[node1] = this.adjList[node1].filter((n) => n !== node2);
    }
    if (this.adjList[node2]) {
      this.adjList[node2] = this.adjList[node2].filter((n) => n !== node1);
    }
  }

  getNeighbors(nodeName: string): GraphNode[] {
    const names = this.adjList[nodeName] || [];
    return names
      .map((name) => this.searchNode(name))
      .filter((node): node is GraphNode => node !== undefined);
  }

  clear(): void {
    this.nodes = [];
    this.adjList = {};
  }
}
