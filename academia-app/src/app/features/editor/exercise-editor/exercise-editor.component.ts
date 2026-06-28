import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { MathEditorComponent } from '../math-editor/math-editor.component';
import { StepDraft } from '../step-editor/step-editor.component';
import { GraphConfig } from '../graph-editor/graph-editor.component';
import { forkJoin, from, of } from 'rxjs';
import { concatMap, toArray, catchError } from 'rxjs/operators';

interface Topic {
  id: string;
  name: string;
}

interface VariableDraft {
  name: string;
  type: 'integer' | 'decimal' | 'list';
  min: number;
  max: number;
  allowedValues: string;
  conditions: string;
}

@Component({
  selector: 'app-exercise-editor',
  templateUrl: './exercise-editor.component.html',
  standalone: false,
})
export class ExerciseEditorComponent implements OnInit {
  @ViewChild('statementEditor') statementEditor!: MathEditorComponent;

  exerciseId: string | null = null;
  isEdit = false;

  title = '';
  statementLatex = '';
  difficulty = 'basic';
  topicId: string | null = null;
  isParametric = false;
  needsGraph = false;

  steps: StepDraft[] = [];
  existingStepIds: string[] = [];
  variables: VariableDraft[] = [];
  graphConfig: GraphConfig | null = null;

  topics: Topic[] = [];
  loading = false;
  saving = false;
  error = '';
  success = '';

  activeTab = 'content';

  variableTypes: { value: string; label: string }[] = [
    { value: 'integer', label: 'Entero' },
    { value: 'decimal', label: 'Decimal' },
    { value: 'list', label: 'Lista de valores' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.api.get<Topic[]>('topics').subscribe((t) => (this.topics = t));

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.exerciseId = id;
      this.isEdit = true;
      this.loadExercise();
    }
  }

  loadExercise(): void {
    this.loading = true;
    this.api.get<any>(`exercises/${this.exerciseId}`).subscribe((ex) => {
      this.title = ex.title;
      this.statementLatex = ex.contentLatex ?? '';
      this.difficulty = ex.difficulty ?? 'basic';
      this.topicId = ex.topic?.id ?? null;
      this.isParametric = ex.isParametric ?? false;
      this.needsGraph = ex.needsGraph ?? false;
      this.loading = false;
    });
    this.api.get<any[]>(`exercises/${this.exerciseId}/steps`).subscribe((steps) => {
      this.existingStepIds = steps.map((s: any) => s.id);
      this.steps = steps.map((s: any) => ({
        stepOrder: s.stepOrder ?? 1,
        contentLatex: s.contentLatex ?? '',
        hint: s.hint ?? '',
        warning: s.warning ?? '',
      }));
    });
  }

  onStatementChange(latex: string): void {
    this.statementLatex = latex;
    const lower = latex.toLowerCase();
    if (/f\(x\)|y\s*=|graficar|sen\(|cos\(|tan\(/.test(lower)) {
      this.needsGraph = true;
    }
  }

  addVariable(): void {
    this.variables.push({
      name: `a${this.variables.length + 1}`,
      type: 'integer',
      min: 1,
      max: 10,
      allowedValues: '',
      conditions: '',
    });
  }

  removeVariable(i: number): void {
    this.variables.splice(i, 1);
  }

  onGraphConfig(config: GraphConfig): void {
    this.graphConfig = config;
  }

  save(): void {
    if (!this.title.trim() || !this.topicId) {
      this.error = 'El título y el tema son obligatorios.';
      return;
    }
    this.error = '';
    this.saving = true;

    const payload = {
      title: this.title.trim(),
      contentLatex: this.statementLatex,
      difficulty: this.difficulty.toUpperCase(),
      topicId: this.topicId,
      isParametric: this.isParametric,
      needsGraph: this.needsGraph,
    };

    const req$ = this.isEdit
      ? this.api.put<any>(`exercises/${this.exerciseId}`, payload)
      : this.api.post<any>('exercises', payload);

    req$.subscribe({
      next: (res: any) => {
        const exId = this.exerciseId ?? res.id;

        if (this.steps.length === 0) {
          this.finalize(exId);
          return;
        }

        // For edit: delete existing steps first, then recreate
        const deleteAll$ = this.isEdit && this.existingStepIds.length > 0
          ? from(this.existingStepIds).pipe(
              concatMap((sid) => this.api.delete(`exercises/${exId}/steps/${sid}`).pipe(catchError(() => of(null)))),
              toArray(),
            )
          : of([]);

        deleteAll$.subscribe(() => {
          from(this.steps).pipe(
            concatMap((step) =>
              this.api.post(`exercises/${exId}/steps`, {
                contentLatex: step.contentLatex,
                hint: step.hint || null,
                warning: step.warning || null,
                stepOrder: step.stepOrder,
              }).pipe(catchError(() => of(null)))
            ),
            toArray(),
          ).subscribe(() => this.finalize(exId));
        });
      },
      error: () => {
        this.saving = false;
        this.error = 'Error al guardar. Verifica que tienes permisos.';
      },
    });
  }

  private finalize(exId: string): void {
    this.saving = false;
    this.success = this.isEdit ? 'Ejercicio actualizado.' : 'Ejercicio creado.';
    setTimeout(() => this.router.navigate(['/exercises', exId]), 1200);
  }
}
