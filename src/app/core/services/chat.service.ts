import { Injectable, inject, signal } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { MensajeChat } from '../../models/mensaje.model';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private sb = inject(SupabaseService).client;
  private auth = inject(AuthService);

  readonly mensajes = signal<MensajeChat[]>([]);
  readonly cargando = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  async cargarMensajes(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.sb
        .from('mensajes')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(80);

      if (error) {
        this.error.set(error.message);
        return;
      }

      this.mensajes.set((data as MensajeChat[]) ?? []);
    } finally {
      this.cargando.set(false);
    }
  }

  async enviarMensaje(contenido: string, nftReferencia: string = ''): Promise<boolean> {
    const texto = contenido.trim();
    const user = this.auth.usuario();
    if (!texto || !user) return false;

    const nuevo: Omit<MensajeChat, 'id' | 'created_at'> = {
      user_id: user.id,
      autor_nombre: this.auth.nombreVisible(),
      autor_email: user.email ?? '',
      autor_rol: this.auth.rol(),
      avatar_url: this.auth.perfil()?.avatar_url ?? '',
      contenido: texto,
      nft_referencia: nftReferencia.trim(),
    };

    const { error } = await this.sb.from('mensajes').insert(nuevo);
    if (error) {
      this.error.set(error.message);
      return false;
    }

    return true;
  }

  async eliminarMensaje(id: number): Promise<void> {
    await this.sb.from('mensajes').delete().eq('id', id);
  }

  escucharEnVivo(alCambiar: () => void): RealtimeChannel {
    return this.sb
      .channel('gifmint-chat-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes' }, alCambiar)
      .subscribe();
  }

  cerrarCanal(canal?: RealtimeChannel): void {
    if (canal) {
      this.sb.removeChannel(canal);
    }
  }
}
