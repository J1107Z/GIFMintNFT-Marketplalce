import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { AdminService } from '../../../core/services/admin.service';
import { RolUsuario } from '../../../models/perfil.model';

@Component({
  selector: 'app-admin-usuarios',
  imports: [DatePipe],
  templateUrl: './admin-usuarios.component.html',
  styleUrl: './admin-usuarios.component.scss',
})
export class AdminUsuariosComponent implements OnInit {
  protected admin = inject(AdminService);

  async ngOnInit(): Promise<void> {
    await this.admin.cargarUsuarios();
  }

  async cambiarRol(id: string, event: Event): Promise<void> {
    const rol = (event.target as HTMLSelectElement).value as RolUsuario;
    await this.admin.actualizarRolUsuario(id, rol);
  }
}
