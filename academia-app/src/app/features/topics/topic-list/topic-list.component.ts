import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, forkJoin, of } from 'rxjs';
import { timeout, catchError, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { selectUserRole } from '../../../store/auth/auth.selectors';

interface Topic {
  id: string;
  name: string;
  description: string;
  order: number;
  is_locked: boolean;
  difficulty: string;
  estimated_minutes: number;
  prerequisite_ids: string[];
  children?: Topic[];
}

interface ProgressSummary {
  topic_name: string;
  xp: number;
  level: number;
  exercises_solved: number;
}

@Component({
  selector: 'app-topic-list',
  templateUrl: './topic-list.component.html',
  standalone: false,
})
export class TopicListComponent implements OnInit, OnDestroy {
  topics: Topic[] = [];
  allTopics: Topic[] = [];
  progressMap: Map<string, ProgressSummary> = new Map();
  loading = false;
  error = '';
  success = '';
  searchQuery = '';
  activeTab: 'todos' | 'basico' | 'intermedio' | 'avanzado' = 'todos';
  userRole: string | undefined;
  Math = Math;

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

  private colorPalette = [
    'from-blue-500 to-indigo-600',
    'from-violet-500 to-purple-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-500',
    'from-rose-500 to-pink-600',
    'from-cyan-500 to-blue-500',
    'from-lime-500 to-green-600',
    'from-fuchsia-500 to-violet-600',
  ];

  private emojiMap: [string, string][] = [
    ['álgebra', '🔣'], ['algebra', '🔣'],
    ['cálculo', '∫'], ['calculo', '∫'],
    ['aritmética', '🔢'], ['aritmetica', '🔢'],
    ['geometría', '📐'], ['geometria', '📐'],
    ['estadística', '📊'], ['estadistica', '📊'],
    ['trigonometría', '📏'], ['trigonometria', '📏'],
    ['probabilidad', '🎲'],
    ['matrices', '⬛'],
    ['vectores', '➡️'],
    ['lógica', '🧠'], ['logica', '🧠'],
  ];

  constructor(private api: ApiService, private store: Store, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.store.select(selectUserRole).pipe(takeUntil(this.destroy$)).subscribe(role => {
      this.userRole = role;
    });
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get canManage(): boolean {
    return this.userRole === 'admin' || this.userRole === 'teacher';
  }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      topics:   this.api.get<Topic[]>('topics').pipe(timeout(15000), catchError(() => of([] as Topic[]))),
      all:      this.api.get<Topic[]>('topics/all').pipe(catchError(() => of([] as Topic[]))),
      progress: this.api.get<ProgressSummary[]>('progress').pipe(catchError(() => of([] as ProgressSummary[]))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ topics, all, progress }) => {
          this.topics = Array.isArray(topics) ? topics : [];
          this.allTopics = Array.isArray(all) ? all : [];
          const map = new Map<string, ProgressSummary>();
          (progress as ProgressSummary[]).forEach(p => map.set(p.topic_name?.toLowerCase(), p));
          this.progressMap = map;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); },
      });
  }

  // ── Succession lock ──────────────────────────────────────

  get allTopicsFlat(): Topic[] {
    const flat: Topic[] = [];
    const recurse = (list: Topic[]) => {
      for (const t of list) {
        flat.push(t);
        if (t.children?.length) recurse(t.children);
      }
    };
    recurse(this.topics);
    return flat;
  }

  topicById(id: string): Topic | undefined {
    return this.allTopicsFlat.find(t => t.id === id);
  }

  isSuccessionLocked(topic: Topic): boolean {
    if (!topic.prerequisite_ids?.length) return false;
    return topic.prerequisite_ids.some(prereqId => {
      const prereq = this.topicById(prereqId);
      if (!prereq) return false;
      const progress = this.getProgress(prereq.name);
      return !progress || progress.exercises_solved === 0;
    });
  }

  isActuallyLocked(topic: Topic): boolean {
    return !!topic.is_locked || this.isSuccessionLocked(topic);
  }

  // ── Filters / tabs ───────────────────────────────────────

  get filtered(): Topic[] {
    let list = this.topics;
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter(
        t => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
          || t.children?.some(c => c.name.toLowerCase().includes(q))
      );
    }
    if (this.activeTab !== 'todos') {
      list = list.filter(t => (t.difficulty || 'basico') === this.activeTab);
    }
    return list;
  }

  get basicTopics(): Topic[]        { return this.topics.filter(t => !t.difficulty || t.difficulty === 'basico'); }
  get intermediateTopics(): Topic[] { return this.topics.filter(t => t.difficulty === 'intermedio'); }
  get advancedTopics(): Topic[]     { return this.topics.filter(t => t.difficulty === 'avanzado'); }

  setTab(value: string): void {
    this.activeTab = value as 'todos' | 'basico' | 'intermedio' | 'avanzado';
  }

  // ── Helpers ──────────────────────────────────────────────

  getColor(index: number): string {
    return this.colorPalette[index % this.colorPalette.length];
  }

  getEmoji(name: string): string {
    const lower = name.toLowerCase();
    for (const [key, emoji] of this.emojiMap) {
      if (lower.includes(key)) return emoji;
    }
    return '📚';
  }

  getProgress(name: string): ProgressSummary | null {
    return this.progressMap.get(name.toLowerCase()) ?? null;
  }

  difficultyBadge(diff: string): { label: string; cls: string } {
    if (diff === 'avanzado')   return { label: 'Avanzado',   cls: 'bg-red-100 text-red-700' };
    if (diff === 'intermedio') return { label: 'Intermedio', cls: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Básico', cls: 'bg-green-100 text-green-700' };
  }

  difficultyColor(value: string): string {
    if (value === 'avanzado') return 'bg-red-100 text-red-700';
    if (value === 'intermedio') return 'bg-yellow-100 text-yellow-700';
    return 'bg-green-100 text-green-700';
  }

  difficultyLabel(value: string): string {
    return this.difficulties.find(d => d.value === value)?.label ?? value;
  }

  get rootTopics(): Topic[] {
    return this.allTopics.filter(t => !(t as any).parent_id);
  }

  prereqOptions(excludeId?: string): Topic[] {
    return this.allTopics.filter(t => t.id !== excludeId);
  }

  togglePrereq(ids: string[], id: string): void {
    const idx = ids.indexOf(id);
    if (idx >= 0) ids.splice(idx, 1);
    else ids.push(id);
  }

  get totalTopics(): number { return this.topics.length; }
  get exploredTopics(): number { return this.progressMap.size; }

  // ── CRUD ─────────────────────────────────────────────────

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
          this.loadAll();
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
      parent_id: (topic as any).parent_id || null,
    };
    this.showEdit = true;
  }

  cancelEdit(): void { this.showEdit = false; this.editingTopic = null; }

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
          this.loadAll();
        },
        error: () => {
          this.saving = false;
          this.error = 'Error al actualizar.';
          setTimeout(() => (this.error = ''), 3000);
        },
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
          this.loadAll();
        },
        error: () => {
          this.deletingId = null;
          this.error = 'Error al eliminar.';
          setTimeout(() => (this.error = ''), 4000);
        },
      });
  }
}
