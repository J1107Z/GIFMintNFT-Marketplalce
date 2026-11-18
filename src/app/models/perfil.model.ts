export type RolUsuario = 'admin' | 'cliente';

export interface PerfilUsuario {
  id: string;
  email: string;
  nombre: string;
  avatar_url: string;
  rol: RolUsuario;
  created_at?: string;
}
