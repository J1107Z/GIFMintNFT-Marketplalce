import { GifNft } from './gif-nft.model';

export type EstadoVenta = 'pendiente' | 'minteado' | 'completada';

export interface CartItem {
  nft: GifNft;
  cantidad: number;
  agregadoEn: string;
}

export interface CartAction {
  tipo: 'ADD' | 'REMOVE' | 'INCREMENT' | 'DECREMENT' | 'CLEAR';
  nft: GifNft;
  cantidadPrevia: number;
  descripcion: string;
  timestamp: string;
  snapshot?: CartItem[];
}

export interface MintOrder {
  orderId: string;
  compradorEmail: string;
  compradorNombre: string;
  items: CartItem[];
  totalUsd: number;
  totalEth: number;
  arrivalDate: string;
  estado: EstadoVenta;
  hashTransaccion: string;
  supabaseVentaId?: number;
}

export interface VentaRegistro {
  id?: number;
  user_id?: string;
  comprador_email: string;
  comprador_nombre: string;
  items: CartItem[];
  cantidad_items: number;
  total_usd: number;
  total_eth: number;
  estado: EstadoVenta;
  hash_transaccion: string;
  created_at?: string;
}
