import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { MintQueueService } from '../../core/services/mint-queue.service';

@Component({
  selector: 'app-carrito',
  imports: [RouterLink],
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.scss',
})
export class CarritoComponent {
  protected cart = inject(CartService);
  protected mintQueue = inject(MintQueueService);
  private router = inject(Router);

  readonly mensajeCheckout = signal<string>('');
  readonly errorCheckout = signal<string>('');

  async finalizarCompra(): Promise<void> {
    this.mensajeCheckout.set('');
    this.errorCheckout.set('');

    const items = this.cart.items();
    if (items.length === 0) return;

    const resultado = await this.mintQueue.registrarCompraYEncolar(
      items,
      this.cart.totalUsd(),
      this.cart.totalEth()
    );

    if (!resultado.ok) {
      this.errorCheckout.set(resultado.error || 'No se pudo completar la orden.');
      return;
    }

    this.cart.vaciarCarrito(false);
    this.mensajeCheckout.set(
      `¡Compra confirmada! Tu orden ${resultado.orden?.orderId} ya está en preparación.`
    );
    setTimeout(() => {
      this.router.navigate(['/mis-ordenes']);
    }, 900);
  }
}
