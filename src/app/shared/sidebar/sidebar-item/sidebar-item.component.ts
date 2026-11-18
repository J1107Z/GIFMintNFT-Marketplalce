import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { IsActiveMatchOptions, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CartService } from '../../../core/services/cart.service';
import { MintQueueService } from '../../../core/services/mint-queue.service';
import { NaryTreeNode } from '../../../data-structures/nary-tree-node';
import { MenuItem } from '../../../models/menu-item.model';

@Component({
  selector: 'app-sidebar-item',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar-item.component.html',
  styleUrl: './sidebar-item.component.scss',
})
export class SidebarItemComponent {
  protected auth = inject(AuthService);
  protected cart = inject(CartService);
  protected mintQueue = inject(MintQueueService);

  @Input({ required: true }) node!: NaryTreeNode<MenuItem>;
  @Input() depth: number = 0;
  @Output() itemSelected = new EventEmitter<MenuItem>();

  readonly exactRouteOptions: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'exact',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };

  readonly pathOnlyOptions: IsActiveMatchOptions = {
    paths: 'exact',
    queryParams: 'ignored',
    matrixParams: 'ignored',
    fragment: 'ignored',
  };

  esVisible(item: MenuItem): boolean {
    if (item.scope === 'admin') {
      return this.auth.esAdmin();
    }
    if (item.scope === 'auth') {
      return this.auth.estaLogueado();
    }
    return true;
  }

  obtenerBadge(badgeKey?: 'cart' | 'favorites' | 'queue'): number {
    switch (badgeKey) {
      case 'cart':
        return this.cart.totalCantidad();
      case 'favorites':
        return this.cart.totalFavoritos();
      case 'queue':
        return this.mintQueue.ordenesEnCola().length;
      default:
        return 0;
    }
  }

  onToggleGroup(): void {
    this.node.toggleExpand();
  }

  onClickLink(item: MenuItem): void {
    this.itemSelected.emit(item);
  }
}
