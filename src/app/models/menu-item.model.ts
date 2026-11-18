import { Type } from '@angular/core';

export type MenuRoleScope = 'public' | 'auth' | 'admin' | 'all';

export interface MenuItem {
  title: string;
  link: string;
  queryParams?: Record<string, string>;
  component: () => Promise<Type<unknown>>;
  componentName: string;
  icon: string;
  isActive?: boolean;
  scope?: MenuRoleScope;
  badgeKey?: 'cart' | 'favorites' | 'queue';
}
