import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

interface Topic {
  id: string;
  name: string;
  description: string;
  parent_id: string | null;
  topic_order: number;
  is_locked: boolean;
  difficulty: string;
  estimated_minutes: number;
  prerequisite_ids: string[];
  children?: Topic[];
}

@Component({
  selector: 'app-topic-management',
  templateUrl: './topic-management.component.html',
  standalone: false,
})
export class TopicManagementComponent implements OnInit, OnDestroy {
  tree: Topic[] = [];
  allTopics: Topic[] = [];
  loading = false;
  error = '';
  success = '';

  // Create modal
  showCreate = false;
  createForm = { name: '', description: '', difficulty: 'basico', estimated_minutes: 0, prerequisite_ids: [] as string[], parent_id: null as string | null };
  creating = false;

  // Edit modal
  showEdit = false;
  editingTopic: Topic | null = null;
  editForm = { name: '', description: '', difficulty: 'basico', estimated_minutes: 0, prerequisite_ids: [] as string[], parent_id: null as string | null };
  saving = false;

  // Delete
  deletingId: string | null = null;
  confirmDeleteId: string | null = null;

  difficulties = [
    { value: 'basico', label: 'Básico' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' },
  ];

  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading = true;
    forkJoin({
      tree: this.api.get<Topic[]>('topics'),
      all:  this.api.get<Topic[]>('topics/all'),
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ tree, all }) => {
          this.tree = tree;
          this.allTopics = all;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); },
      });
  }

  get rootTopics(): Topic[] {
    return this.allTopics.filter(t => !t.parent_id);
  }

  prereqOptions(excludeId?: string): Topic[] {
    return this.allTopics.filter(t => t.id !== excludeId);
  }

  togglePrereq(ids: string[], id: string): void {
    const idx = ids.indexOf(id);
    if (idx >= 0) ids.splice(idx, 1);
    else ids.push(id);
  }

  create(): void {
    if (!this.createForm.name.trim()) return;
    this.creating = true;
    this.api.post<Topic>('topics', {
      name: this.createForm.name.trim(),
      description: this.createForm.description.trim() || null,
      difficulty: this.createForm.difficulty,
      estimated_minutes: this.createForm.estimated_minutes || 0,
      prerequisite_ids: this.createForm.prerequisite_ids,
      parent_id: this.createForm.parent_id,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.creating = false;
          this.showCreate = false;
          this.createForm = { name: '', description: '', difficulty: 'basico', estimated_minutes: 0, prerequisite_ids: [], parent_id: null };
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
    this.editingTopic = topic;
    this.editForm = {
      name: topic.name,
      description: topic.description || '',
      difficulty: topic.difficulty || 'basico',
      estimated_minutes: topic.estimated_minutes || 0,
      prerequisite_ids: [...(topic.prerequisite_ids || [])],
      parent_id: topic.parent_id,
    };
    this.showEdit = true;
  }

  cancelEdit(): void {
    this.showEdit = false;
    this.editingTopic = null;
  }

  saveTopic(): void {
    if (!this.editingTopic || !this.editForm.name.trim()) return;
    this.saving = true;
    this.api.put(`topics/${this.editingTopic.id}`, {
      name: this.editForm.name.trim(),
      description: this.editForm.description.trim() || null,
      difficulty: this.editForm.difficulty,
      estimated_minutes: this.editForm.estimated_minutes || 0,
      prerequisite_ids: this.editForm.prerequisite_ids,
      parent_id: this.editForm.parent_id,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.showEdit = false;
          this.editingTopic = null;
          this.success = 'Tema actualizado.';
          setTimeout(() => (this.success = ''), 3000);
          this.load();
        },
        error: () => {
          this.saving = false;
          this.error = 'Error al actualizar.';
          setTimeout(() => (this.error = ''), 3000);
        },
      });
  }

  toggleLock(topic: Topic): void {
    this.api.put(`topics/${topic.id}`, { is_locked: !topic.is_locked })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          topic.is_locked = !topic.is_locked;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error toggling lock:', err),
      });
  }

  confirmDelete(id: string): void { this.confirmDeleteId = id; }
  cancelDelete(): void { this.confirmDeleteId = null; }

  deleteTopic(topic: Topic): void {
    this.deletingId = topic.id;
    this.api.delete(`topics/${topic.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
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

  difficultyLabel(value: string): string {
    return this.difficulties.find(d => d.value === value)?.label ?? value;
  }

  difficultyColor(value: string): string {
    if (value === 'avanzado') return 'bg-red-100 text-red-700';
    if (value === 'intermedio') return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  }

  get totalTopics(): number { return this.allTopics.length; }
}
