import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { useAuth } from '../../hooks/use-auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private router = inject(Router);
  protected authHook = useAuth();

  email = '';
  clave = '';
  readonly enviando = signal<boolean>(false);
  readonly mensajeError = signal<string>('');

  async entrar(): Promise<void> {
    this.mensajeError.set('');
    this.enviando.set(true);
    try {
      const { error } = await this.authHook.entrar(this.email, this.clave);
      if (error) {
        this.mensajeError.set(error.message);
      } else {
        this.router.navigate(['/']);
      }
    } finally {
      this.enviando.set(false);
    }
  }
}
