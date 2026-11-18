import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AdminService } from '../../../core/services/admin.service';
import { EstadoVenta } from '../../../models/venta.model';

@Component({
  selector: 'app-admin-ventas',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './admin-ventas.component.html',
  styleUrl: './admin-ventas.component.scss',
})
export class AdminVentasComponent implements OnInit, OnDestroy {
  protected admin = inject(AdminService);
  private canal?: RealtimeChannel;

  async ngOnInit(): Promise<void> {
    await this.admin.cargarTodasLasVentas();
    this.canal = this.admin.escucharVentasEnVivo(() => {
      void this.admin.cargarTodasLasVentas();
    });
  }

  ngOnDestroy(): void {
    this.admin.cerrarCanal(this.canal);
  }

  async cambiarEstado(id: number, event: Event): Promise<void> {
    const nuevoEstado = (event.target as HTMLSelectElement).value as EstadoVenta;
    await this.admin.actualizarEstadoVenta(id, nuevoEstado);
  }
}
