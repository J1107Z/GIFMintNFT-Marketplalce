import { Injectable, computed, inject, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { PerfilUsuario, RolUsuario } from '../../models/perfil.model';
import { EstadoVenta, VentaRegistro } from '../../models/venta.model';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private sb = inject(SupabaseService).client;

  readonly ventas = signal<VentaRegistro[]>([]);
  readonly usuarios = signal<PerfilUsuario[]>([]);
  readonly cargandoVentas = signal<boolean>(false);
  readonly cargandoUsuarios = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly ingresosTotales = computed(() =>
    this.ventas().reduce((acc, v) => acc + Number(v.total_usd || 0), 0)
  );

  readonly totalOrdenes = computed(() => this.ventas().length);

  readonly ticketPromedio = computed(() => {
    const total = this.totalOrdenes();
    return total > 0 ? Math.round(this.ingresosTotales() / total) : 0;
  });

  readonly ordenesPendientes = computed(
    () => this.ventas().filter((v) => v.estado === 'pendiente').length
  );

  async cargarTodasLasVentas(): Promise<void> {
    this.cargandoVentas.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.sb
        .from('ventas')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        this.error.set(error.message);
        return;
      }

      this.ventas.set((data as VentaRegistro[]) ?? []);
    } finally {
      this.cargandoVentas.set(false);
    }
  }

  async actualizarEstadoVenta(id: number, estado: EstadoVenta): Promise<boolean> {
    const { error } = await this.sb.from('ventas').update({ estado }).eq('id', id);
    if (error) {
      this.error.set(error.message);
      return false;
    }

    this.ventas.update((lista) =>
      lista.map((v) => (v.id === id ? { ...v, estado } : v))
    );
    return true;
  }

  async cargarUsuarios(): Promise<void> {
    this.cargandoUsuarios.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.sb
        .from('perfiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        this.error.set(error.message);
        return;
      }

      this.usuarios.set((data as PerfilUsuario[]) ?? []);
    } finally {
      this.cargandoUsuarios.set(false);
    }
  }

  async actualizarRolUsuario(id: string, rol: RolUsuario): Promise<boolean> {
    const { error } = await this.sb.from('perfiles').update({ rol }).eq('id', id);
    if (error) {
      this.error.set(error.message);
      return false;
    }

    this.usuarios.update((lista) => lista.map((u) => (u.id === id ? { ...u, rol } : u)));
    return true;
  }

  escucharVentasEnVivo(alCambiar: () => void): RealtimeChannel {
    return this.sb
      .channel('gifmint-admin-ventas-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ventas' }, alCambiar)
      .subscribe();
  }

  cerrarCanal(canal?: RealtimeChannel): void {
    if (canal) {
      this.sb.removeChannel(canal);
    }
  }
}
