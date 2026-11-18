import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Session, User } from '@supabase/supabase-js';
import { PerfilUsuario, RolUsuario } from '../../models/perfil.model';
import { SupabaseService } from './supabase.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private sb = inject(SupabaseService).client;
  private router = inject(Router);

  readonly session = signal<Session | null>(null);
  readonly perfil = signal<PerfilUsuario | null>(null);
  readonly cargando = signal<boolean>(true);
  readonly error = signal<string | null>(null);

  readonly usuario = computed<User | null>(() => this.session()?.user ?? null);
  readonly estaLogueado = computed<boolean>(() => this.session() !== null);
  readonly rol = computed<RolUsuario>(() => this.perfil()?.rol ?? 'cliente');
  readonly esAdmin = computed<boolean>(() => this.rol() === 'admin');
  readonly nombreVisible = computed<string>(() => {
    const p = this.perfil();
    if (p?.nombre && p.nombre.trim().length > 0) {
      return p.nombre;
    }
    const email = this.session()?.user?.email;
    return email ? email.split('@')[0] : 'Invitado';
  });

  private initPromise: Promise<void>;

  constructor() {
    this.initPromise = this.inicializarSesion();
    this.sb.auth.onAuthStateChange((_evento, s) => {
      this.session.set(s);
      this.sincronizarTokenLocal(s);
      if (s?.user) {
        void this.cargarPerfil(s.user);
      } else {
        this.perfil.set(null);
      }
    });
  }

  private async inicializarSesion(): Promise<void> {
    this.cargando.set(true);
    try {
      const { data } = await this.sb.auth.getSession();
      this.session.set(data.session);
      this.sincronizarTokenLocal(data.session);
      if (data.session?.user) {
        await this.cargarPerfil(data.session.user);
      }
    } finally {
      this.cargando.set(false);
    }
  }

  async esperarInicializacion(): Promise<void> {
    await this.initPromise;
  }

  private sincronizarTokenLocal(session: Session | null): void {
    if (typeof localStorage === 'undefined') return;
    if (session?.access_token) {
      localStorage.setItem('gifmint_access_token', session.access_token);
    } else {
      localStorage.removeItem('gifmint_access_token');
    }
  }

  async cargarPerfil(user: User): Promise<PerfilUsuario | null> {
    const { data, error } = await this.sb
      .from('perfiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.warn('[AuthService] No se pudo leer perfil de Supabase:', error.message);
      const fallback: PerfilUsuario = {
        id: user.id,
        email: user.email ?? '',
        nombre:
          (user.user_metadata?.['nombre'] as string) ||
          (user.email ? user.email.split('@')[0] : 'Usuario'),
        avatar_url: '',
        rol: 'cliente',
      };
      this.perfil.set(fallback);
      return fallback;
    }

    if (data) {
      this.perfil.set(data as PerfilUsuario);
      return data as PerfilUsuario;
    }

    // Crear perfil cliente si el usuario existía antes de aplicar el trigger SQL
    const nuevoPerfil: Omit<PerfilUsuario, 'created_at'> = {
      id: user.id,
      email: user.email ?? '',
      nombre:
        (user.user_metadata?.['nombre'] as string) ||
        (user.email ? user.email.split('@')[0] : 'Usuario'),
      avatar_url: '',
      rol: 'cliente',
    };

    const { data: inserted, error: insertError } = await this.sb
      .from('perfiles')
      .insert(nuevoPerfil)
      .select('*')
      .single();

    if (!insertError && inserted) {
      this.perfil.set(inserted as PerfilUsuario);
      return inserted as PerfilUsuario;
    }

    this.perfil.set(nuevoPerfil);
    return nuevoPerfil;
  }

  async registrar(email: string, clave: string, nombre: string) {
    this.error.set(null);
    const { data, error } = await this.sb.auth.signUp({
      email: email.trim(),
      password: clave,
      options: {
        data: {
          nombre: nombre.trim() || email.split('@')[0],
        },
      },
    });

    if (error) {
      this.error.set(error.message);
      return { data, error };
    }

    if (data.session?.user) {
      this.session.set(data.session);
      await this.cargarPerfil(data.session.user);
    }

    return { data, error: null };
  }

  async entrar(email: string, clave: string) {
    this.error.set(null);
    const { data, error } = await this.sb.auth.signInWithPassword({
      email: email.trim(),
      password: clave,
    });

    if (error) {
      this.error.set(error.message);
      return { data, error };
    }

    if (data.session?.user) {
      this.session.set(data.session);
      await this.cargarPerfil(data.session.user);
    }

    return { data, error: null };
  }

  async actualizarPerfil(cambios: { nombre?: string; avatar_url?: string }) {
    const user = this.usuario();
    if (!user) return { error: new Error('No hay sesión activa') };

    const { data, error } = await this.sb
      .from('perfiles')
      .update(cambios)
      .eq('id', user.id)
      .select('*')
      .single();

    if (!error && data) {
      this.perfil.set(data as PerfilUsuario);
    }

    return { data, error };
  }

  async salir(): Promise<void> {
    await this.sb.auth.signOut();
    this.session.set(null);
    this.perfil.set(null);
    this.sincronizarTokenLocal(null);
    this.router.navigate(['/login']);
  }
}
