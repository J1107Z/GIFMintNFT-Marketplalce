import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MintQueueService } from '../../core/services/mint-queue.service';
import { SupabaseService } from '../../core/services/supabase.service';
import { useAuth } from '../../hooks/use-auth';

@Component({
  selector: 'app-perfil',
  imports: [FormsModule, DatePipe],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.scss',
})
export class PerfilComponent implements OnInit {
  private sb = inject(SupabaseService).client;
  protected authHook = useAuth();
  protected mintQueue = inject(MintQueueService);

  nombreEditable = '';
  readonly avatarUrl = signal<string>('');
  readonly subiendo = signal<boolean>(false);
  readonly mensaje = signal<string>('');
  readonly error = signal<string>('');

  async ngOnInit(): Promise<void> {
    const perfil = this.authHook.perfil();
    if (perfil) {
      this.nombreEditable = perfil.nombre;
      this.avatarUrl.set(perfil.avatar_url || '');
    }
    await this.mintQueue.cargarMisCompras();
  }

  // Clase 10: Subir y mostrar foto de perfil en Supabase Storage bucket 'avatars'
  async subirAvatar(event: Event): Promise<void> {
    this.error.set('');
    this.mensaje.set('');

    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    this.subiendo.set(true);
    try {
      const {
        data: { user },
      } = await this.sb.auth.getUser();
      if (!user) {
        this.error.set('Sesión no encontrada.');
        return;
      }

      const ruta = `${user.id}/${Date.now()}-${file.name}`;
      let { error } = await this.sb.storage
        .from('avatars')
        .upload(ruta, file, { upsert: true });

      if (error) {
        ({ error } = await this.sb.storage.from('avatars').upload(ruta, file));
      }

      if (error) {
        this.error.set(`No se pudo subir la imagen: ${error.message}`);
        return;
      }

      const publicUrl = this.sb.storage.from('avatars').getPublicUrl(ruta).data.publicUrl;
      this.avatarUrl.set(publicUrl);

      await this.authHook.actualizarPerfil({ avatar_url: publicUrl });
      this.mensaje.set('Foto de perfil actualizada correctamente.');
    } finally {
      this.subiendo.set(false);
    }
  }

  async guardarNombre(): Promise<void> {
    this.error.set('');
    this.mensaje.set('');

    const clean = this.nombreEditable.trim();
    if (!clean) return;

    const { error } = await this.authHook.actualizarPerfil({ nombre: clean });
    if (error) {
      this.error.set(error.message);
    } else {
      this.mensaje.set('Nombre de perfil guardado.');
    }
  }
}
