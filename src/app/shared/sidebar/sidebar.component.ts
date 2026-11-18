import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MenuTreeService } from '../../core/services/menu-tree.service';
import { NaryTreeNode } from '../../data-structures/nary-tree-node';
import { MenuItem } from '../../models/menu-item.model';
import { SidebarItemComponent } from './sidebar-item/sidebar-item.component';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, SidebarItemComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  private menuTreeService = inject(MenuTreeService);
  protected auth = inject(AuthService);

  @Output() navigateClose = new EventEmitter<void>();

  readonly menuNodes = signal<NaryTreeNode<MenuItem>[]>([]);

  ngOnInit(): void {
    const root = this.menuTreeService.menuTree.root;
    if (root) {
      this.menuNodes.set(root.children);
    }
  }

  onItemSelected(selected: MenuItem): void {
    this.menuTreeService.menuTree.dfs((node) => {
      node.value.isActive =
        node.value.link === selected.link &&
        node.value.queryParams?.['cat'] === selected.queryParams?.['cat'];
    });
    this.navigateClose.emit();
  }

  inicialUsuario(): string {
    return this.auth.nombreVisible().charAt(0).toUpperCase() || 'G';
  }
}
