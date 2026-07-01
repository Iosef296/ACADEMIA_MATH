import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { selectUserRole } from '../../../store/auth/auth.selectors';

interface Exercise {
  id: string;
  title: string;
  contentLatex?: string;
  difficulty: string;
  isParametric?: boolean;
  needsGraph?: boolean;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  is_locked: boolean;
  difficulty?: string;
  estimated_minutes?: number;
  prerequisite_ids?: string[];
  parent_id?: string | null;
  children?: Topic[];
}

interface Progress {
  xp: number;
  level: number;
  exercises_solved: number;
  error_count: number;
}

interface ProgressSummary {
  topic_name: string;
  xp: number;
  level: number;
  exercises_solved: number;
}

@Component({
  selector: 'app-topic-detail',
  templateUrl: './topic-detail.component.html',
  standalone: false,
})
export class TopicDetailComponent implements OnInit, OnDestroy {
  topicId = '';
  topic: Topic | null = null;
  allTopics: Topic[] = [];
  exercises: Exercise[] = [];
  progress: Progress | null = null;
  progressMap: Map<string, ProgressSummary> = new Map();
  loading = false;
  error = '';
  success = '';
  userRole: string | undefined;

  difficultyLabel: Record<string, string> = {
    basic: 'Básico', intermediate: 'Intermedio', advanced: 'Avanzado',
    basico: 'Básico', intermedio: 'Intermedio', avanzado: 'Avanzado',
  };

  difficultyColor: Record<string, string> = {
    basic: 'bg-green-100 text-green-700', intermediate: 'bg-yellow-100 text-yellow-700', advanced: 'bg-red-100 text-red-700',
    basico: 'bg-green-100 text-green-700', intermedio: 'bg-yellow-100 text-yellow-700', avanzado: 'bg-red-100 text-red-700',
  };

  showCreate = false;
  createForm = { name: '', description: '', difficulty: 'basico', estimated_minutes: 0, prerequisite_ids: [] as string[] };
  creating = false;

  showEdit = false;
  editingTema: Topic | null = null;
  editForm = { name: '', description: '', difficulty: 'basico', estimated_minutes: 0, prerequisite_ids: [] as string[] };
  saving = false;

  confirmDeleteId: string | null = null;
  deletingId: string | null = null;

  // Edit current topic (the tema being viewed)
  showEditCurrent = false;
  editCurrentForm = { name: '', description: '', difficulty: 'basico', estimated_minutes: 0 };
  savingCurrent = false;

  // Exercise CRUD
  newVarName = '';

  showEditEx = false;
  editingEx: Exercise | null = null;
  editExForm = { title: '', contentLatex: '', difficulty: 'basic', isParametric: false, needsGraph: false, graphType: '' };
  savingEx = false;
  editExVars: Array<{ varName: string; minVal: number | null; maxVal: number | null; stepVal: number | null; integerOnly: boolean }> = [];
  editNewVarName = '';

  confirmDeleteExId: string | null = null;
  deletingExId: string | null = null;

  ocrLoadingEdit = false;
  ocrDragOverEdit = false;

  exerciseDifficulties = [
    { value: 'basic', label: 'Básico' },
    { value: 'intermediate', label: 'Intermedio' },
    { value: 'advanced', label: 'Avanzado' },
  ];

  graphTypes = [
    { value: 'function', label: 'Función' },
    { value: 'geometry', label: 'Geometría' },
    { value: 'bar', label: 'Barras' },
    { value: 'pie', label: 'Circular' },
    { value: 'scatter', label: 'Dispersión' },
    { value: 'line', label: 'Línea' },
  ];

  difficulties = [
    { value: 'basico', label: 'Básico' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private store: Store,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.store.select(selectUserRole).pipe(takeUntil(this.destroy$)).subscribe(role => {
      this.userRole = role;
    });
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.topicId = params.get('id') ?? '';
      this.topic = null;
      this.exercises = [];
      this.progress = null;
      this.loadTopic();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get canManage(): boolean {
    return this.userRole === 'admin' || this.userRole === 'teacher';
  }

  get xpToNextLevel(): number {
    if (!this.progress) return 100;
    return 100 - (this.progress.xp % 100);
  }

  get xpPercent(): number {
    if (!this.progress) return 0;
    return this.progress.xp % 100;
  }

  get basicExercises()        { return this.exercises.filter(e => e.difficulty?.toLowerCase() === 'basic'); }
  get intermediateExercises() { return this.exercises.filter(e => e.difficulty?.toLowerCase() === 'intermediate'); }
  get advancedExercises()     { return this.exercises.filter(e => e.difficulty?.toLowerCase() === 'advanced'); }

  // Only temas (child topics with parent_id) as prereq options
  get prereqOptionsCreate(): Topic[] {
    return this.allTopics.filter(t => t.parent_id);
  }

  get prereqOptions(): Topic[] {
    return this.allTopics.filter(t => t.parent_id && t.id !== this.editingTema?.id);
  }

  isLocked(child: Topic): boolean {
    if (child.is_locked) return true;
    if (!child.prerequisite_ids?.length) return false;
    return child.prerequisite_ids.some(prereqId => {
      const prereq = this.allTopics.find(t => t.id === prereqId);
      if (!prereq) return false;
      const prog = this.progressMap.get(prereq.name?.toLowerCase());
      return !prog || prog.exercises_solved === 0;
    });
  }

  loadTopic(): void {
    this.loading = true;
    Promise.all([
      firstValueFrom(this.api.get<Topic>(`topics/${this.topicId}`)),
      firstValueFrom(this.api.get<Exercise[]>(`exercises?topicId=${this.topicId}`)),
      firstValueFrom(this.api.get<Progress>(`progress/topics/${this.topicId}`)),
      firstValueFrom(this.api.get<Topic[]>('topics/all')),
      firstValueFrom(this.api.get<ProgressSummary[]>('progress')),
    ]).then(([topic, exercises, progress, allTopics, progressList]) => {
      this.topic = topic ?? null;
      this.exercises = exercises ?? [];
      this.progress = progress ?? null;
      this.allTopics = Array.isArray(allTopics) ? allTopics : [];
      const map = new Map<string, ProgressSummary>();
      (Array.isArray(progressList) ? progressList : []).forEach(p => map.set(p.topic_name?.toLowerCase(), p));
      this.progressMap = map;
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  togglePrereq(ids: string[], id: string): void {
    const idx = ids.indexOf(id);
    if (idx >= 0) ids.splice(idx, 1);
    else ids.push(id);
  }

  difficultyBadge(diff: string): { label: string; cls: string } {
    if (diff === 'avanzado' || diff === 'advanced') return { label: 'Avanzado', cls: 'bg-red-100 text-red-700' };
    if (diff === 'intermedio' || diff === 'intermediate') return { label: 'Intermedio', cls: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Básico', cls: 'bg-green-100 text-green-700' };
  }

  createTopic(): void {
    if (!this.createForm.name.trim()) return;
    this.creating = true;
    this.api.post<Topic>('topics', {
      name: this.createForm.name.trim(),
      description: this.createForm.description.trim() || null,
      difficulty: this.createForm.difficulty,
      estimated_minutes: this.createForm.estimated_minutes || 0,
      prerequisite_ids: this.createForm.prerequisite_ids,
      parent_id: this.topicId,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.creating = false;
          this.showCreate = false;
          this.createForm = { name: '', description: '', difficulty: 'basico', estimated_minutes: 0, prerequisite_ids: [] };
          this.success = 'Tema añadido.';
          setTimeout(() => (this.success = ''), 3000);
          this.loadTopic();
        },
        error: () => {
          this.creating = false;
          this.error = 'Error al crear el tema.';
          setTimeout(() => (this.error = ''), 3000);
        },
      });
  }

  startEdit(tema: Topic): void {
    this.editingTema = tema;
    this.editForm = {
      name: tema.name,
      description: tema.description || '',
      difficulty: tema.difficulty || 'basico',
      estimated_minutes: tema.estimated_minutes || 0,
      prerequisite_ids: [...(tema.prerequisite_ids || [])],
    };
    this.showEdit = true;
  }

  cancelEdit(): void {
    this.showEdit = false;
    this.editingTema = null;
  }

  saveTopic(): void {
    if (!this.editingTema || !this.editForm.name.trim()) return;
    this.saving = true;
    this.api.put(`topics/${this.editingTema.id}`, {
      name: this.editForm.name.trim(),
      description: this.editForm.description.trim() || null,
      difficulty: this.editForm.difficulty,
      estimated_minutes: this.editForm.estimated_minutes || 0,
      prerequisite_ids: this.editForm.prerequisite_ids,
      parent_id: this.topicId,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.showEdit = false;
          this.editingTema = null;
          this.success = 'Tema actualizado.';
          setTimeout(() => (this.success = ''), 3000);
          this.loadTopic();
        },
        error: () => {
          this.saving = false;
          this.error = 'Error al actualizar el tema.';
          setTimeout(() => (this.error = ''), 3000);
        },
      });
  }

  confirmDelete(id: string): void { this.confirmDeleteId = id; }
  cancelDelete(): void { this.confirmDeleteId = null; }

  deleteTema(tema: Topic): void {
    this.deletingId = tema.id;
    this.api.delete(`topics/${tema.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deletingId = null;
          this.confirmDeleteId = null;
          this.success = `"${tema.name}" eliminado.`;
          setTimeout(() => (this.success = ''), 3000);
          this.loadTopic();
        },
        error: () => {
          this.deletingId = null;
          this.error = 'Error al eliminar.';
          setTimeout(() => (this.error = ''), 3000);
        },
      });
  }

  // ── Edit current tema ────────────────────────────────

  startEditCurrent(): void {
    if (!this.topic) return;
    this.editCurrentForm = {
      name: this.topic.name,
      description: this.topic.description || '',
      difficulty: this.topic.difficulty || 'basico',
      estimated_minutes: this.topic.estimated_minutes || 0,
    };
    this.showEditCurrent = true;
  }

  cancelEditCurrent(): void { this.showEditCurrent = false; }

  saveCurrentTopic(): void {
    if (!this.topic || !this.editCurrentForm.name.trim()) return;
    this.savingCurrent = true;
    this.api.put(`topics/${this.topicId}`, {
      name: this.editCurrentForm.name.trim(),
      description: this.editCurrentForm.description.trim() || null,
      difficulty: this.editCurrentForm.difficulty,
      estimated_minutes: this.editCurrentForm.estimated_minutes || 0,
      parent_id: this.topic.parent_id || null,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.savingCurrent = false;
          this.showEditCurrent = false;
          this.success = 'Tema actualizado.';
          setTimeout(() => (this.success = ''), 3000);
          this.loadTopic();
        },
        error: () => {
          this.savingCurrent = false;
          this.error = 'Error al actualizar tema.';
          setTimeout(() => (this.error = ''), 3000);
        },
      });
  }

  // ── Exercise CRUD ────────────────────────────────────

  // ── OCR (edit modal only) ────────────────────────────

  processOcrEdit(file: File): void {
    this.ocrLoadingEdit = true;
    this.api.upload<{ latex: string; text: string }>('ocr/extract', file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.editExForm.contentLatex = res.latex ?? res.text ?? '';
          this.ocrLoadingEdit = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.ocrLoadingEdit = false;
          this.error = 'Error al procesar imagen OCR.';
          setTimeout(() => (this.error = ''), 3000);
          this.cdr.detectChanges();
        },
      });
  }

  onOcrFileEdit(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.processOcrEdit(file);
  }

  onOcrDropEdit(event: DragEvent): void {
    event.preventDefault(); this.ocrDragOverEdit = false;
    const file = event.dataTransfer?.files[0];
    if (file?.type.startsWith('image/')) this.processOcrEdit(file);
  }

  addEditExVar(): void {
    if (!this.editNewVarName.trim()) return;
    this.editExVars.push({ varName: this.editNewVarName.trim(), minVal: 1, maxVal: 10, stepVal: null, integerOnly: true });
    this.editNewVarName = '';
  }

  removeEditExVar(i: number): void { this.editExVars.splice(i, 1); }

  // ── Navigate to create exercise page ────────────────

  goToCreateExercise(): void {
    this.router.navigate(['/exercises', 'new'], {
      queryParams: { topicId: this.topicId, topicName: this.topic?.name ?? '' },
    });
  }

  // ── Exercise CRUD (edit/delete only) ────────────────

  startEditEx(ex: Exercise): void {
    this.editingEx = ex;
    this.editExForm = {
      title: ex.title,
      contentLatex: ex.contentLatex || '',
      difficulty: ex.difficulty?.toLowerCase() || 'basic',
      isParametric: ex.isParametric || false,
      needsGraph: ex.needsGraph || false,
      graphType: (ex as any).graphType || '',
    };
    this.editExVars = [];
    this.editNewVarName = '';
    this.showEditEx = true;
  }

  cancelEditEx(): void { this.showEditEx = false; this.editingEx = null; }

  saveExercise(): void {
    if (!this.editingEx || !this.editExForm.title.trim()) return;
    this.savingEx = true;
    this.api.put(`exercises/${this.editingEx.id}`, {
      title: this.editExForm.title.trim(),
      contentLatex: this.editExForm.contentLatex.trim() || ' ',
      difficulty: this.editExForm.difficulty.toUpperCase(),
      isParametric: this.editExForm.isParametric,
      needsGraph: this.editExForm.needsGraph,
      graphType: this.editExForm.graphType || null,
      topicId: this.topicId,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exercise: any) => {
          const vars = [...this.editExVars];
          const postVars = vars.map(v =>
            firstValueFrom(this.api.post(`exercises/${exercise.id}/variables`, {
              varName: v.varName, minVal: v.minVal, maxVal: v.maxVal,
              stepVal: v.stepVal, integerOnly: v.integerOnly,
              constraintType: null, constraintValue: null,
            }))
          );
          Promise.allSettled(postVars).then(() => {
            this.savingEx = false;
            this.showEditEx = false;
            this.editingEx = null;
            this.editExVars = [];
            this.success = 'Ejercicio actualizado.';
            setTimeout(() => (this.success = ''), 3000);
            this.loadTopic();
          });
        },
        error: () => {
          this.savingEx = false;
          this.error = 'Error al actualizar ejercicio.';
          setTimeout(() => (this.error = ''), 3000);
        },
      });
  }

  confirmDeleteEx(id: string): void { this.confirmDeleteExId = id; }
  cancelDeleteEx(): void { this.confirmDeleteExId = null; }

  deleteExercise(ex: Exercise): void {
    this.deletingExId = ex.id;
    this.api.delete(`exercises/${ex.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deletingExId = null;
          this.confirmDeleteExId = null;
          this.success = `"${ex.title}" eliminado.`;
          setTimeout(() => (this.success = ''), 3000);
          this.loadTopic();
        },
        error: () => {
          this.deletingExId = null;
          this.error = 'Error al eliminar ejercicio.';
          setTimeout(() => (this.error = ''), 3000);
        },
      });
  }
}
