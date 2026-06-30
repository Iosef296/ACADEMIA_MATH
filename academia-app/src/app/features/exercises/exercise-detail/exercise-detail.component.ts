import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { selectUserRole } from '../../../store/auth/auth.selectors';

interface Step {
  id: string;
  stepOrder: number;
  contentLatex: string;
  hint?: string;
  warning?: string;
  // runtime state
  revealed: boolean;
  hintShown: boolean;
  userAnswer: string;
  solutionRevealed: boolean;
  answered: boolean;
  correct: boolean | null;
}

interface Exercise {
  id: string;
  title: string;
  contentLatex: string;
  difficulty: string;
  isParametric: boolean;
  needsGraph: boolean;
  topic?: { id: string; name: string };
}

interface VariableValues {
  [key: string]: number;
}

interface ExerciseVariable {
  id: string;
  varName: string;
  minVal: number | null;
  maxVal: number | null;
  stepVal: number | null;
  constraintType: string | null;
  constraintValue: string | null;
  integerOnly: boolean;
}

interface VariableForm {
  varName: string;
  minVal: number | null;
  maxVal: number | null;
  stepVal: number | null;
  constraintType: string;
  constraintValue: string;
  integerOnly: boolean;
}

// For teacher step management
interface StepForm {
  contentLatex: string;
  hint: string;
  warning: string;
}

@Component({
  selector: 'app-exercise-detail',
  templateUrl: './exercise-detail.component.html',
  standalone: false,
})
export class ExerciseDetailComponent implements OnInit, OnDestroy {
  exerciseId = '';
  exercise: Exercise | null = null;
  steps: Step[] = [];
  variableValues: VariableValues = {};
  resolvedStatement = '';

  loading = false;
  allDone = false;
  hintsUsed = 0;
  startTime = Date.now();

  // Difficulty rating
  showRating = false;
  ratingSubmitted = false;
  ratings = [
    { value: 'easy', label: 'Fácil', emoji: '😊' },
    { value: 'medium', label: 'Regular', emoji: '🤔' },
    { value: 'hard', label: 'Difícil', emoji: '😓' },
    { value: 'no_idea', label: 'Sin idea', emoji: '😵' },
  ];

  showMicroLesson = false;

  // Teacher step management
  userRole: string | undefined = undefined;
  showStepManager = false;
  stepSaving = false;
  stepError = '';
  stepSuccess = '';
  editingStepId: string | null = null;
  newStepForm: StepForm = { contentLatex: '', hint: '', warning: '' };
  editStepForm: StepForm = { contentLatex: '', hint: '', warning: '' };

  // Teacher variable management
  exerciseVariables: ExerciseVariable[] = [];
  showVariableManager = false;
  varSaving = false;
  varError = '';
  varSuccess = '';
  editingVarId: string | null = null;
  newVarForm: VariableForm = { varName: '', minVal: null, maxVal: null, stepVal: null, constraintType: '', constraintValue: '', integerOnly: false };
  editVarForm: VariableForm = { varName: '', minVal: null, maxVal: null, stepVal: null, constraintType: '', constraintValue: '', integerOnly: false };

  readonly constraintOptions = [
    { value: '', label: 'Ninguna' },
    { value: 'prime', label: 'Primo' },
    { value: 'even', label: 'Par' },
    { value: 'odd', label: 'Impar' },
    { value: 'positive', label: 'Positivo' },
    { value: 'divisible', label: 'Divisible por...' },
    { value: 'not_divisible', label: 'No divisible por...' },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private store: Store,
  ) {}

  ngOnInit(): void {
    this.store.select(selectUserRole).pipe(takeUntil(this.destroy$)).subscribe((role) => {
      this.userRole = role;
      this.cdr.detectChanges();
    });
    this.exerciseId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isTeacher(): boolean {
    return this.userRole === 'teacher' || this.userRole === 'admin';
  }

  loadVariables(): void {
    this.api.get<ExerciseVariable[]>(`exercises/${this.exerciseId}/variables`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ next: (vars) => { this.exerciseVariables = vars ?? []; this.cdr.detectChanges(); } });
  }

  load(): void {
    this.loading = true;
    Promise.all([
      firstValueFrom(this.api.get<Exercise>(`exercises/${this.exerciseId}`)),
      firstValueFrom(this.api.get<any[]>(`exercises/${this.exerciseId}/steps`)),
    ]).then(([exercise, rawSteps]) => {
      this.exercise = exercise ?? null;

      if (exercise?.isParametric) {
        this.api
          .get<{ values: VariableValues; content_latex: string }>(
            `exercises/${this.exerciseId}/generate`
          )
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (res) => {
              this.variableValues = res.values;
              this.resolvedStatement = res.content_latex;
              this.cdr.detectChanges();
            },
            error: () => {
              this.resolvedStatement = exercise?.contentLatex ?? '';
              this.cdr.detectChanges();
            },
          });
      } else {
        this.resolvedStatement = exercise?.contentLatex ?? '';
      }

      this.steps = (rawSteps ?? []).map((s) => ({
        ...s,
        revealed: false,
        hintShown: false,
        userAnswer: '',
        solutionRevealed: false,
        answered: false,
        correct: null,
      }));

      if (this.steps.length > 0) {
        this.steps[0].revealed = true;
      }

      this.loading = false;
      this.cdr.detectChanges();
      if (this.isTeacher) this.loadVariables();
    }).catch(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  // ── Student resolution ──────────────────────────────

  get currentStepIndex(): number {
    return this.steps.findIndex((s) => s.revealed && !s.answered);
  }

  get currentStep(): Step | null {
    const idx = this.currentStepIndex;
    return idx >= 0 ? this.steps[idx] : null;
  }

  showHint(step: Step): void {
    step.hintShown = true;
    this.hintsUsed++;
  }

  revealSolution(step: Step): void {
    step.solutionRevealed = true;
  }

  confirmStep(step: Step, isCorrect: boolean): void {
    step.answered = true;
    step.correct = isCorrect;
    if (!isCorrect) this.hintsUsed++;

    const nextIdx = this.steps.indexOf(step) + 1;
    if (nextIdx < this.steps.length) {
      this.steps[nextIdx].revealed = true;
    } else {
      this.allDone = true;
      this.showRating = true;
    }
  }

  submitRating(rating: string): void {
    const timeSpent = Math.round((Date.now() - this.startTime) / 1000);
    this.api
      .post('exercises/rate', {
        exerciseId: this.exerciseId,
        rating,
        hintsUsed: this.hintsUsed,
        timeSpent,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          this.ratingSubmitted = true;
          this.showRating = false;
          if (res?.triggerMicroLesson) {
            this.showMicroLesson = true;
          }
        },
        error: (err) => console.error('Error:', err),
      });
  }

  restart(): void {
    this.allDone = false;
    this.showRating = false;
    this.ratingSubmitted = false;
    this.showMicroLesson = false;
    this.hintsUsed = 0;
    this.startTime = Date.now();
    this.load();
  }

  // ── Teacher: step management ────────────────────────

  addStep(): void {
    if (!this.newStepForm.contentLatex.trim()) {
      this.stepError = 'El contenido del paso es obligatorio.';
      return;
    }
    this.stepSaving = true;
    this.stepError = '';
    this.api.post(`exercises/${this.exerciseId}/steps`, {
      contentLatex: this.newStepForm.contentLatex.trim(),
      hint: this.newStepForm.hint.trim() || null,
      warning: this.newStepForm.warning.trim() || null,
      stepOrder: this.steps.length + 1,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.stepSaving = false;
          this.stepSuccess = 'Paso agregado.';
          this.newStepForm = { contentLatex: '', hint: '', warning: '' };
          setTimeout(() => (this.stepSuccess = ''), 2500);
          this.load();
        },
        error: () => {
          this.stepSaving = false;
          this.stepError = 'Error al agregar paso.';
        },
      });
  }

  startEditStep(step: Step): void {
    this.editingStepId = step.id;
    this.editStepForm = {
      contentLatex: step.contentLatex,
      hint: step.hint ?? '',
      warning: step.warning ?? '',
    };
  }

  cancelEditStep(): void {
    this.editingStepId = null;
  }

  saveEditStep(step: Step): void {
    if (!this.editStepForm.contentLatex.trim()) return;
    this.stepSaving = true;
    this.api.put(`exercises/${this.exerciseId}/steps/${step.id}`, {
      contentLatex: this.editStepForm.contentLatex.trim(),
      hint: this.editStepForm.hint.trim() || null,
      warning: this.editStepForm.warning.trim() || null,
      stepOrder: step.stepOrder,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.stepSaving = false;
          this.editingStepId = null;
          this.stepSuccess = 'Paso actualizado.';
          setTimeout(() => (this.stepSuccess = ''), 2500);
          this.load();
        },
        error: () => {
          this.stepSaving = false;
          this.stepError = 'Error al actualizar paso.';
        },
      });
  }

  deleteStep(step: Step): void {
    if (!confirm(`¿Eliminar paso ${step.stepOrder}?`)) return;
    this.api.delete(`exercises/${this.exerciseId}/steps/${step.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.stepSuccess = 'Paso eliminado.';
          setTimeout(() => (this.stepSuccess = ''), 2500);
          this.load();
        },
        error: () => {
          this.stepError = 'Error al eliminar paso.';
        },
      });
  }

  // ── Teacher: variable management ────────────────────

  get needsConstraintValue(): boolean {
    return this.newVarForm.constraintType === 'divisible' || this.newVarForm.constraintType === 'not_divisible';
  }

  get editNeedsConstraintValue(): boolean {
    return this.editVarForm.constraintType === 'divisible' || this.editVarForm.constraintType === 'not_divisible';
  }

  addVariable(): void {
    if (!this.newVarForm.varName.trim()) {
      this.varError = 'El nombre de variable es obligatorio.';
      return;
    }
    this.varSaving = true;
    this.varError = '';
    this.api.post(`exercises/${this.exerciseId}/variables`, {
      varName: this.newVarForm.varName.trim(),
      minVal: this.newVarForm.minVal,
      maxVal: this.newVarForm.maxVal,
      stepVal: this.newVarForm.stepVal,
      constraintType: this.newVarForm.constraintType || null,
      constraintValue: this.newVarForm.constraintValue || null,
      integerOnly: this.newVarForm.integerOnly,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.varSaving = false;
          this.varSuccess = 'Variable agregada.';
          this.newVarForm = { varName: '', minVal: null, maxVal: null, stepVal: null, constraintType: '', constraintValue: '', integerOnly: false };
          setTimeout(() => (this.varSuccess = ''), 2500);
          this.loadVariables();
        },
        error: () => { this.varSaving = false; this.varError = 'Error al agregar variable.'; },
      });
  }

  startEditVar(v: ExerciseVariable): void {
    this.editingVarId = v.id;
    this.editVarForm = {
      varName: v.varName,
      minVal: v.minVal,
      maxVal: v.maxVal,
      stepVal: v.stepVal,
      constraintType: v.constraintType ?? '',
      constraintValue: v.constraintValue ?? '',
      integerOnly: v.integerOnly,
    };
  }

  cancelEditVar(): void {
    this.editingVarId = null;
  }

  saveEditVar(v: ExerciseVariable): void {
    if (!this.editVarForm.varName.trim()) return;
    this.varSaving = true;
    this.api.put(`exercises/${this.exerciseId}/variables/${v.id}`, {
      varName: this.editVarForm.varName.trim(),
      minVal: this.editVarForm.minVal,
      maxVal: this.editVarForm.maxVal,
      stepVal: this.editVarForm.stepVal,
      constraintType: this.editVarForm.constraintType || null,
      constraintValue: this.editVarForm.constraintValue || null,
      integerOnly: this.editVarForm.integerOnly,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.varSaving = false;
          this.editingVarId = null;
          this.varSuccess = 'Variable actualizada.';
          setTimeout(() => (this.varSuccess = ''), 2500);
          this.loadVariables();
        },
        error: () => { this.varSaving = false; this.varError = 'Error al actualizar variable.'; },
      });
  }

  deleteVar(v: ExerciseVariable): void {
    if (!confirm(`¿Eliminar variable "${v.varName}"?`)) return;
    this.api.delete(`exercises/${this.exerciseId}/variables/${v.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.varSuccess = 'Variable eliminada.';
          setTimeout(() => (this.varSuccess = ''), 2500);
          this.loadVariables();
        },
        error: () => { this.varError = 'Error al eliminar variable.'; },
      });
  }
}
