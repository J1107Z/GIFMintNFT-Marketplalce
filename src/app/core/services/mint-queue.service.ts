import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { Queue } from '../../data-structures/queue';
import { CartItem, EstadoVenta, MintOrder, VentaRegistro } from '../../models/venta.model';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class MintQueueService {
  private sb = inject(SupabaseService).client;
  private auth = inject(AuthService);

  // Clase 06: Queue (FIFO) interna para procesar órdenes por orden cronológico de llegada
  readonly colaMinteo = new Queue<MintOrder>();

  readonly ordenesEnCola = signal<MintOrder[]>([]);
  readonly historialCompras = signal<VentaRegistro[]>([]);
  readonly cargandoCompras = signal<boolean>(false);
  readonly procesando = signal<boolean>(false);
  readonly mensajeCola = signal<string>('');

  private activeUserId: string | null | undefined = undefined;

  constructor() {
    effect(() => {
      const userId = this.auth.usuario()?.id ?? null;
      untracked(() => {
        if (this.activeUserId !== userId) {
          this.activeUserId = userId;
          this.limpiarEstadoUsuario();
          if (userId) {
            void this.cargarMisCompras();
          }
        }
      });
    });
  }

  limpiarEstadoUsuario(): void {
    this.colaMinteo.clear();
    this.ordenesEnCola.set([]);
    this.historialCompras.set([]);
    this.mensajeCola.set('');
  }

  async registrarCompraYEncolar(
    items: CartItem[],
    totalUsd: number,
    totalEth: number
  ): Promise<{ ok: boolean; orden?: MintOrder; error?: string }> {
    const user = this.auth.usuario();
    if (!user) {
      return { ok: false, error: 'Debes iniciar sesión para realizar una compra.' };
    }
    if (items.length === 0) {
      return { ok: false, error: 'El carrito está vacío.' };
    }

    this.procesando.set(true);
    const hash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`;
    const llegada = new Date().toISOString();
    const cantidadItems = items.reduce((acc, i) => acc + i.cantidad, 0);

    const registro: Omit<VentaRegistro, 'id' | 'created_at'> = {
      user_id: user.id,
      comprador_email: user.email ?? '',
      comprador_nombre: this.auth.nombreVisible(),
      items: items.map((i) => ({ ...i })),
      cantidad_items: cantidadItems,
      total_usd: Number(totalUsd.toFixed(2)),
      total_eth: Number(totalEth.toFixed(4)),
      estado: 'pendiente',
      hash_transaccion: hash,
    };

    try {
      const { data, error } = await this.sb
        .from('ventas')
        .insert(registro)
        .select('*')
        .single();

      if (error) {
        return { ok: false, error: error.message };
      }

      const orden: MintOrder = {
        orderId: `ORD-${data.id}`,
        compradorEmail: registro.comprador_email,
        compradorNombre: registro.comprador_nombre,
        items: registro.items,
        totalUsd: registro.total_usd,
        totalEth: registro.total_eth,
        arrivalDate: data.created_at ?? llegada,
        estado: (data.estado as EstadoVenta) || 'pendiente',
        hashTransaccion: hash,
        supabaseVentaId: data.id as number,
      };

      this.colaMinteo.enqueue(orden);
      this.ordenesEnCola.set(this.colaMinteo.toArray());
      this.mensajeCola.set(`Orden ${orden.orderId} recibida y en preparación.`);

      await this.cargarMisCompras();
      return { ok: true, orden };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error registrando la compra';
      return { ok: false, error: msg };
    } finally {
      this.procesando.set(false);
    }
  }

  async cargarMisCompras(): Promise<void> {
    const user = this.auth.usuario();
    if (!user) {
      this.limpiarEstadoUsuario();
      return;
    }

    this.cargandoCompras.set(true);
    try {
      const { data, error } = await this.sb
        .from('ventas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const ventasUsuario = data as VentaRegistro[];
        this.historialCompras.set(ventasUsuario);

        this.colaMinteo.clear();
        const pendientes = [...ventasUsuario]
          .filter((v) => v.estado !== 'completada')
          .sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));

        for (const v of pendientes) {
          this.colaMinteo.enqueue({
            orderId: `ORD-${v.id}`,
            compradorEmail: v.comprador_email,
            compradorNombre: v.comprador_nombre,
            items: v.items,
            totalUsd: Number(v.total_usd),
            totalEth: Number(v.total_eth),
            arrivalDate: v.created_at ?? new Date().toISOString(),
            estado: v.estado,
            hashTransaccion: v.hash_transaccion,
            supabaseVentaId: v.id,
          });
        }
        this.ordenesEnCola.set(this.colaMinteo.toArray());
      }
    } finally {
      this.cargandoCompras.set(false);
    }
  }

  // Procesa la siguiente orden en preparación (FIFO dequeue interno)
  desencolarFrente(): MintOrder | undefined {
    const atendida = this.colaMinteo.dequeue();
    this.ordenesEnCola.set(this.colaMinteo.toArray());
    if (atendida) {
      this.mensajeCola.set(`Orden ${atendida.orderId} procesada y lista para entrega digital.`);
    } else {
      this.mensajeCola.set('No hay órdenes pendientes por procesar.');
    }
    return atendida;
  }
}
