export type GraphNodeType = 'hub' | 'creador' | 'coleccion';

export class GraphNode {
  name: string;
  type: GraphNodeType;
  subtitle?: string;
  weight?: number;

  constructor(name: string, type: GraphNodeType, subtitle?: string, weight?: number) {
    this.name = name;
    this.type = type;
    this.subtitle = subtitle;
    this.weight = weight;
  }
}

export class HubNode extends GraphNode {
  constructor(name: string, region: string) {
    super(name, 'hub', region);
  }
}

export class CreatorNode extends GraphNode {
  constructor(name: string, specialty: string) {
    super(name, 'creador', specialty);
  }
}

export class CollectionNode extends GraphNode {
  constructor(name: string, category: string, floorPrice: number) {
    super(name, 'coleccion', category, floorPrice);
  }
}
