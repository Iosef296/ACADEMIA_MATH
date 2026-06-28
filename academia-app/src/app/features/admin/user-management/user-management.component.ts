import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  created_at: string;
}

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  standalone: false,
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  loading = false;
  searchQuery = '';
  filterRole = '';

  // Edit role
  editingId: number | null = null;
  editingRole: string = '';
  savingId: number | null = null;

  // Delete
  deletingId: number | null = null;
  confirmDeleteId: number | null = null;

  error = '';
  success = '';

  roles = [
    { value: 'student', label: 'Estudiante' },
    { value: 'teacher', label: 'Docente' },
    { value: 'admin',   label: 'Admin' },
  ];

  roleColor: Record<string, string> = {
    student: 'bg-blue-100 text-blue-700',
    teacher: 'bg-green-100 text-green-700',
    admin:   'bg-red-100 text-red-700',
  };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.get<User[]>('users').subscribe({
      next: (data) => { this.users = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  get filtered(): User[] {
    return this.users.filter((u) => {
      const matchSearch =
        !this.searchQuery.trim() ||
        u.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchRole = !this.filterRole || u.role === this.filterRole;
      return matchSearch && matchRole;
    });
  }

  startEdit(user: User): void {
    this.editingId = user.id;
    this.editingRole = user.role;
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveRole(user: User): void {
    if (this.editingRole === user.role) { this.cancelEdit(); return; }
    this.savingId = user.id;
    this.api.put(`users/${user.id}/role`, { role: this.editingRole }).subscribe({
      next: () => {
        user.role = this.editingRole as User['role'];
        this.savingId = null;
        this.editingId = null;
        this.success = `Rol de ${user.name} actualizado.`;
        setTimeout(() => (this.success = ''), 3000);
      },
      error: () => {
        this.savingId = null;
        this.error = 'Error al cambiar el rol.';
        setTimeout(() => (this.error = ''), 3000);
      },
    });
  }

  confirmDelete(id: number): void {
    this.confirmDeleteId = id;
  }

  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  deleteUser(user: User): void {
    this.deletingId = user.id;
    this.api.delete(`users/${user.id}`).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.id !== user.id);
        this.deletingId = null;
        this.confirmDeleteId = null;
        this.success = `Usuario ${user.name} eliminado.`;
        setTimeout(() => (this.success = ''), 3000);
      },
      error: () => {
        this.deletingId = null;
        this.error = 'Error al eliminar usuario.';
        setTimeout(() => (this.error = ''), 3000);
      },
    });
  }
}
