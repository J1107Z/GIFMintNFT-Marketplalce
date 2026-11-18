import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { useAuth } from '../../hooks/use-auth';

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss',
})
export class RegistroComponent {
  private router = inject(Router);
  protected authHook = useAuth();

  nombre = '';
  email = '';
  clave = '';
  readonly enviando = signal<boolean>(false);
  readonly mensajeError = signal<string>('');
  readonly mensajeExito = signal<string>('');

  async registrar(): Promise<void> {
    this.mensajeError.set('');
    this.mensajeExito.set('');
    this.enviando.set(true);

    try {
      const { data, error } = await this.authHook.registrar(
        this.email,
        this.clave,
        this.nombre
      );

      if (error) {
        this.mensajeError.set(error.message);
      } else if (data.session) {
        this.router.navigate(['/']);
      } else {
        this.mensajeExito.set(
          'Cuenta creada. Revisa tu correo para confirmar la cuenta antes de ingresar.'
        );
      }
    } finally {
      this.enviando.set(false);
    }
  }
}
