import { Injectable } from '@angular/core';
import { NaryTree } from '../../data-structures/nary-tree';
import { GIF_CATEGORIES, GifCategory } from '../../models/gif-nft.model';
import { MenuItem } from '../../models/menu-item.model';

export interface CategoryNodeData {
  nombre: string;
  categoria?: GifCategory;
  descripcion: string;
}

@Injectable({
  providedIn: 'root',
})
export class MenuTreeService {
  readonly menuTree: NaryTree<MenuItem>;
  readonly categoryTree: NaryTree<CategoryNodeData>;

  constructor() {
    this.menuTree = this.construirArbolMenu();
    this.categoryTree = this.construirArbolCategorias();
  }

  // Clase 07: NaryTree para el Sidebar jerárquico multinivel (07-SideBar)
  private construirArbolMenu(): NaryTree<MenuItem> {
    const loadHome = () =>
      import('../../pages/home/home.component').then((m) => m.HomeComponent);
    const loadCatalogo = () =>
      import('../../pages/catalogo/catalogo.component').then((m) => m.CatalogoComponent);

    const rootItem: MenuItem = {
      title: 'GIFMint Root',
      link: '/',
      componentName: 'HomeComponent',
      component: loadHome,
      icon: 'bi-grid',
      scope: 'all',
    };

    const tree = new NaryTree<MenuItem>(rootItem);
    const root = tree.root!;

    // Rama 1: Explorar (público)
    const explorar = root.addChild({
      title: 'Explorar',
      link: '/',
      componentName: 'HomeComponent',
      component: loadHome,
      icon: 'bi-compass',
      scope: 'all',
    });
    explorar.expanded = true;

    explorar.addChild({
      title: 'Inicio',
      link: '/',
      componentName: 'HomeComponent',
      component: loadHome,
      icon: 'bi-house-door',
      scope: 'all',
      isActive: true,
    });
    explorar.addChild({
      title: 'Catálogo',
      link: '/catalogo',
      componentName: 'CatalogoComponent',
      component: loadCatalogo,
      icon: 'bi-grid-3x3-gap',
      scope: 'all',
    });

    // Subrama multinivel: Categorías dentro de Explorar (NaryTree multinivel)
    const categoriasNode = explorar.addChild({
      title: 'Categorías',
      link: '/catalogo',
      componentName: 'CatalogoComponent',
      component: loadCatalogo,
      icon: 'bi-tags',
      scope: 'all',
    });
    categoriasNode.expanded = false;

    const arteDigital = categoriasNode.addChild({
      title: 'Arte Digital & Futurismo',
      link: '/catalogo',
      componentName: 'CatalogoComponent',
      component: loadCatalogo,
      icon: 'bi-stars',
      scope: 'all',
    });
    arteDigital.expanded = true;
    arteDigital.addChild({
      title: 'Cyberpunk',
      link: '/catalogo',
      queryParams: { cat: 'Cyberpunk' },
      componentName: 'CatalogoComponent',
      component: loadCatalogo,
      icon: 'bi-lightning',
      scope: 'all',
    });
    arteDigital.addChild({
      title: 'Arte 3D',
      link: '/catalogo',
      queryParams: { cat: 'Arte 3D' },
      componentName: 'CatalogoComponent',
      component: loadCatalogo,
      icon: 'bi-box',
      scope: 'all',
    });

    const culturaPop = categoriasNode.addChild({
      title: 'Cultura Pop & Pixel',
      link: '/catalogo',
      componentName: 'CatalogoComponent',
      component: loadCatalogo,
      icon: 'bi-controller',
      scope: 'all',
    });
    culturaPop.expanded = true;
    culturaPop.addChild({
      title: 'Anime',
      link: '/catalogo',
      queryParams: { cat: 'Anime' },
      componentName: 'CatalogoComponent',
      component: loadCatalogo,
      icon: 'bi-film',
      scope: 'all',
    });
    culturaPop.addChild({
      title: 'Gaming',
      link: '/catalogo',
      queryParams: { cat: 'Gaming' },
      componentName: 'CatalogoComponent',
      component: loadCatalogo,
      icon: 'bi-joystick',
      scope: 'all',
    });

    const culturaViral = categoriasNode.addChild({
      title: 'Cultura Viral',
      link: '/catalogo',
      componentName: 'CatalogoComponent',
      component: loadCatalogo,
      icon: 'bi-emoji-laughing',
      scope: 'all',
    });
    culturaViral.expanded = true;
    culturaViral.addChild({
      title: 'Memes',
      link: '/catalogo',
      queryParams: { cat: 'Memes' },
      componentName: 'CatalogoComponent',
      component: loadCatalogo,
      icon: 'bi-chat-quote',
      scope: 'all',
    });
    culturaViral.addChild({
      title: 'Reacciones',
      link: '/catalogo',
      queryParams: { cat: 'Reacciones' },
      componentName: 'CatalogoComponent',
      component: loadCatalogo,
      icon: 'bi-emoji-smile',
      scope: 'all',
    });

    // Rama 2: Mi Colección (privado — protegido con authGuard)
    const coleccion = root.addChild({
      title: 'Mi Colección',
      link: '/carrito',
      componentName: 'CarritoComponent',
      component: () =>
        import('../../pages/carrito/carrito.component').then((m) => m.CarritoComponent),
      icon: 'bi-collection',
      scope: 'auth',
    });
    coleccion.expanded = true;

    coleccion.addChild({
      title: 'Favoritos',
      link: '/favoritos',
      componentName: 'FavoritosComponent',
      component: () =>
        import('../../pages/favoritos/favoritos.component').then((m) => m.FavoritosComponent),
      icon: 'bi-heart',
      scope: 'auth',
      badgeKey: 'favorites',
    });
    coleccion.addChild({
      title: 'Carrito',
      link: '/carrito',
      componentName: 'CarritoComponent',
      component: () =>
        import('../../pages/carrito/carrito.component').then((m) => m.CarritoComponent),
      icon: 'bi-bag',
      scope: 'auth',
      badgeKey: 'cart',
    });
    coleccion.addChild({
      title: 'Mis Órdenes',
      link: '/mis-ordenes',
      componentName: 'ColaMinteoComponent',
      component: () =>
        import('../../pages/cola-minteo/cola-minteo.component').then(
          (m) => m.ColaMinteoComponent
        ),
      icon: 'bi-receipt',
      scope: 'auth',
      badgeKey: 'queue',
    });

    // Rama 3: Comunidad & Cuenta (privado — protegido con authGuard)
    const comunidad = root.addChild({
      title: 'Comunidad & Cuenta',
      link: '/chat',
      componentName: 'ChatComponent',
      component: () => import('../../pages/chat/chat.component').then((m) => m.ChatComponent),
      icon: 'bi-chat-dots',
      scope: 'auth',
    });
    comunidad.expanded = true;

    comunidad.addChild({
      title: 'Chat',
      link: '/chat',
      componentName: 'ChatComponent',
      component: () => import('../../pages/chat/chat.component').then((m) => m.ChatComponent),
      icon: 'bi-chat-square-text',
      scope: 'auth',
    });
    comunidad.addChild({
      title: 'Mi Perfil',
      link: '/perfil',
      componentName: 'PerfilComponent',
      component: () =>
        import('../../pages/perfil/perfil.component').then((m) => m.PerfilComponent),
      icon: 'bi-person-circle',
      scope: 'auth',
    });

    // Rama 4: Administración (exclusivo rol === 'admin' — authGuard + adminGuard)
    const admin = root.addChild({
      title: 'Administración',
      link: '/admin/ventas',
      componentName: 'AdminVentasComponent',
      component: () =>
        import('../../pages/admin/admin-ventas/admin-ventas.component').then(
          (m) => m.AdminVentasComponent
        ),
      icon: 'bi-shield-check',
      scope: 'admin',
    });
    admin.expanded = true;

    admin.addChild({
      title: 'Ventas',
      link: '/admin/ventas',
      componentName: 'AdminVentasComponent',
      component: () =>
        import('../../pages/admin/admin-ventas/admin-ventas.component').then(
          (m) => m.AdminVentasComponent
        ),
      icon: 'bi-graph-up-arrow',
      scope: 'admin',
    });
    admin.addChild({
      title: 'Usuarios',
      link: '/admin/usuarios',
      componentName: 'AdminUsuariosComponent',
      component: () =>
        import('../../pages/admin/admin-usuarios/admin-usuarios.component').then(
          (m) => m.AdminUsuariosComponent
        ),
      icon: 'bi-people',
      scope: 'admin',
    });

    return tree;
  }

  // Clase 07: NaryTree para jerarquía de categorías del E-Commerce
  private construirArbolCategorias(): NaryTree<CategoryNodeData> {
    const tree = new NaryTree<CategoryNodeData>({
      nombre: 'Colecciones GIF-NFT',
      descripcion: 'Taxonomía completa del marketplace',
    });

    const root = tree.root!;

    const arteDigital = root.addChild({
      nombre: 'Arte Digital & Futurismo',
      descripcion: 'Loops generativos, neón y renderizado 3D',
    });
    arteDigital.addChild({
      nombre: 'Cyberpunk',
      categoria: 'Cyberpunk',
      descripcion: 'Estética neon, glitch y synthwave',
    });
    arteDigital.addChild({
      nombre: 'Arte 3D',
      categoria: 'Arte 3D',
      descripcion: 'Esculturas cinéticas y shaders procedurales',
    });

    const culturaPop = root.addChild({
      nombre: 'Cultura Pop & Pixel',
      descripcion: 'Animación japonesa y videojuegos retro',
    });
    culturaPop.addChild({
      nombre: 'Anime',
      categoria: 'Anime',
      descripcion: 'Escenas anime en loop de alta rareza',
    });
    culturaPop.addChild({
      nombre: 'Gaming',
      categoria: 'Gaming',
      descripcion: 'Sprites pixel art y momentos gamer',
    });

    const virales = root.addChild({
      nombre: 'Cultura Viral',
      descripcion: 'Memes clásicos y reacciones coleccionables',
    });
    virales.addChild({
      nombre: 'Memes',
      categoria: 'Memes',
      descripcion: 'Piezas icónicas de internet tokenizadas',
    });
    virales.addChild({
      nombre: 'Reacciones',
      categoria: 'Reacciones',
      descripcion: 'Expresiones animadas de edición limitada',
    });

    return tree;
  }

  obtenerListaCategorias(): GifCategory[] {
    return [...GIF_CATEGORIES];
  }
}
