import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

interface Topic {
  id: number;
  name: string;
  parent_id: number | null;
  order: number;
  is_locked: boolean;
  children?: Topic[];
}

@Component({
  selector: 'app-topic-management',
  templateUrl: './topic-management.component.html',
  standalone: false,
})
export class TopicManagementComponent implements OnInit {
  topics: Topic[] = [];
  tree: Topic[] = [];
  loading = false;
  error = '';
  success = '';

  // Create
  showCreate = false;
  newName = '';
  newParentId: number | null = null;
  creating = false;

  // Edit
  editingId: number | null = null;
  editingName = '';
  savingId: number | null = null;

  // Delete
  deletingId: number | null = null;
  confirmDeleteId: number | null = null;

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.get<Topic[]>('topics').subscribe({
      next: (data) => {
        this.topics = data;
        this.tree = this.buildTree(data);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  private buildTree(flat: Topic[]): Topic[] {
    const map = new Map<number, Topic>();
    flat.forEach((t) => map.set(t.id, { ...t, children: [] }));
    const roots: Topic[] = [];
    map.forEach((t) => {
      if (t.parent_id && map.has(t.parent_id)) {
        map.get(t.parent_id)!.children!.push(t);
      } else {
        roots.push(t);
      }
    });
    return roots.sort((a, b) => a.order - b.order);
  }

  create(): void {
    if (!this.newName.trim()) return;
    this.creating = true;
    this.api.post<Topic>('topics', {
      name: this.newName.trim(),
      parent_id: this.newParentId,
    }).subscribe({
      next: () => {
        this.creating = false;
        this.showCreate = false;
        this.newName = '';
        this.newParentId = null;
        this.success = 'Tema creado.';
        setTimeout(() => (this.success = ''), 3000);
        this.load();
      },
      error: () => {
        this.creating = false;
        this.error = 'Error al crear el tema.';
        setTimeout(() => (this.error = ''), 3000);
      },
    });
  }

  startEdit(topic: Topic): void {
    this.editingId = topic.id;
    this.editingName = topic.name;
  }

  cancelEdit(): void { this.editingId = null; }

  saveTopic(topic: Topic): void {
    if (!this.editingName.trim() || this.editingName === topic.name) {
      this.cancelEdit();
      return;
    }
    this.savingId = topic.id;
    this.api.put(`topics/${topic.id}`, { name: this.editingName.trim() }).subscribe({
      next: () => {
        topic.name = this.editingName.trim();
        this.savingId = null;
        this.editingId = null;
        this.success = 'Tema actualizado.';
        setTimeout(() => (this.success = ''), 3000);
      },
      error: () => {
        this.savingId = null;
        this.error = 'Error al actualizar.';
        setTimeout(() => (this.error = ''), 3000);
      },
    });
  }

  toggleLock(topic: Topic): void {
    this.api.put(`topics/${topic.id}`, { is_locked: !topic.is_locked }).subscribe({
      next: () => { topic.is_locked = !topic.is_locked; },
    });
  }

  confirmDelete(id: number): void { this.confirmDeleteId = id; }
  cancelDelete(): void { this.confirmDeleteId = null; }

  deleteTopic(topic: Topic): void {
    this.deletingId = topic.id;
    this.api.delete(`topics/${topic.id}`).subscribe({
      next: () => {
        this.deletingId = null;
        this.confirmDeleteId = null;
        this.success = `"${topic.name}" eliminado.`;
        setTimeout(() => (this.success = ''), 3000);
        this.load();
      },
      error: () => {
        this.deletingId = null;
        this.error = 'Error al eliminar. Puede tener ejercicios asociados.';
        setTimeout(() => (this.error = ''), 4000);
      },
    });
  }

  get rootTopics(): Topic[] {
    return this.topics.filter((t) => !t.parent_id);
  }
}
