import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MintQueueService } from '../../core/services/mint-queue.service';

@Component({
  selector: 'app-cola-minteo',
  imports: [DatePipe, RouterLink],
  templateUrl: './cola-minteo.component.html',
  styleUrl: './cola-minteo.component.scss',
})
export class ColaMinteoComponent implements OnInit {
  protected mintQueue = inject(MintQueueService);

  async ngOnInit(): Promise<void> {
    await this.mintQueue.cargarMisCompras();
  }
}
