import { RolUsuario } from './perfil.model';

export interface MensajeChat {
  id?: number;
  user_id?: string;
  autor_nombre: string;
  autor_email: string;
  autor_rol: RolUsuario;
  avatar_url?: string;
  contenido: string;
  nft_referencia?: string;
  created_at?: string;
}
