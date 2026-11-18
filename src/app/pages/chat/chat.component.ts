import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { MarketCatalogService } from '../../core/services/market-catalog.service';

@Component({
  selector: 'app-chat',
  imports: [FormsModule, DatePipe],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.scss',
})
export class ChatComponent implements OnInit, OnDestroy {
  protected chat = inject(ChatService);
  protected auth = inject(AuthService);
  protected catalog = inject(MarketCatalogService);

  private canal?: RealtimeChannel;

  nuevoMensaje = '';
  nftReferencia = '';
  readonly enviando = signal<boolean>(false);

  async ngOnInit(): Promise<void> {
    await this.chat.cargarMensajes();
    this.canal = this.chat.escucharEnVivo(() => {
      void this.chat.cargarMensajes();
    });
  }

  ngOnDestroy(): void {
    this.chat.cerrarCanal(this.canal);
  }

  async enviar(): Promise<void> {
    if (!this.nuevoMensaje.trim()) return;
    this.enviando.set(true);
    try {
      const ok = await this.chat.enviarMensaje(this.nuevoMensaje, this.nftReferencia);
      if (ok) {
        this.nuevoMensaje = '';
        this.nftReferencia = '';
        await this.chat.cargarMensajes();
      }
    } finally {
      this.enviando.set(false);
    }
  }
}
