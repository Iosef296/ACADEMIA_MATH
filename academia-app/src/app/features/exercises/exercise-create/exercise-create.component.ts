import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

interface VarEntry {
  varName: string;
  minVal: number | null;
  maxVal: number | null;
  stepVal: number | null;
  integerOnly: boolean;
}

@Component({
  selector: 'app-exercise-create',
  templateUrl: './exercise-create.component.html',
  standalone: false,
})
export class ExerciseCreateComponent implements OnInit, OnDestroy {
  topicId = '';
  topicName = '';

  form = {
    title: '',
    contentLatex: '',
    difficulty: 'basic',
    isParametric: false,
    needsGraph: false,
    graphType: 'function',
  };

  vars: VarEntry[] = [];
  newVarName = '';

  saving = false;
  error = '';
  ocrLoading = false;
  ocrDragOver = false;

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

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.topicId = params.get('topicId') ?? '';
      this.topicName = params.get('topicName') ?? 'Tema';
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  processOcr(file: File): void {
    this.ocrLoading = true;
    this.api.upload<{ latex: string; text: string }>('ocr/extract', file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.form.contentLatex = res.latex ?? res.text ?? '';
          this.ocrLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.ocrLoading = false;
          this.error = 'Error al procesar imagen OCR.';
          setTimeout(() => (this.error = ''), 3000);
          this.cdr.detectChanges();
        },
      });
  }

  onOcrFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.processOcr(file);
  }

  onOcrDrop(event: DragEvent): void {
    event.preventDefault();
    this.ocrDragOver = false;
    const file = event.dataTransfer?.files[0];
    if (file?.type.startsWith('image/')) this.processOcr(file);
  }

  addVar(): void {
    if (!this.newVarName.trim()) return;
    this.vars.push({ varName: this.newVarName.trim(), minVal: 1, maxVal: 10, stepVal: null, integerOnly: true });
    this.newVarName = '';
  }

  removeVar(i: number): void { this.vars.splice(i, 1); }

  cancel(): void {
    if (this.topicId) this.router.navigate(['/topics', this.topicId]);
    else this.router.navigate(['/topics']);
  }

  save(): void {
    if (!this.form.title.trim() || !this.topicId) return;
    this.saving = true;
    this.error = '';
    this.api.post<{ id: string }>('exercises', {
      title: this.form.title.trim(),
      contentLatex: this.form.contentLatex.trim() || ' ',
      difficulty: this.form.difficulty.toUpperCase(),
      isParametric: this.form.isParametric,
      needsGraph: this.form.needsGraph,
      graphType: this.form.needsGraph ? (this.form.graphType || 'function') : null,
      topicId: this.topicId,
    }).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exercise) => {
          const postVars = this.vars.map(v =>
            firstValueFrom(this.api.post(`exercises/${exercise.id}/variables`, {
              varName: v.varName, minVal: v.minVal, maxVal: v.maxVal,
              stepVal: v.stepVal, integerOnly: v.integerOnly,
              constraintType: null, constraintValue: null,
            }))
          );
          Promise.allSettled(postVars).then(() => {
            this.saving = false;
            this.router.navigate(['/topics', this.topicId]);
          });
        },
        error: () => {
          this.saving = false;
          this.error = 'Error al crear el ejercicio.';
          this.cdr.detectChanges();
        },
      });
  }
}
