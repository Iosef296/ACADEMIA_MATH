import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PdfTemplate } from '../template-selector/template-selector.component';

interface Exercise {
  id: string;
  title: string;
  difficulty: string;
  topic?: { id: string; name: string };
}

interface DocumentSection {
  id: number;
  type: 'title' | 'text' | 'exercise';
  content: string;
  exerciseId?: string;
  exerciseTitle?: string;
}

@Component({
  selector: 'app-pdf-builder',
  templateUrl: './pdf-builder.component.html',
  standalone: false,
})
export class PdfBuilderComponent implements OnInit {
  templateId: number | null = null;
  template: PdfTemplate | null = null;

  documentTitle = 'Documento sin título';
  sections: DocumentSection[] = [];
  nextId = 1;

  // Exercise picker
  exercises: Exercise[] = [];
  exerciseSearch = '';
  showExercisePicker = false;

  generating = false;
  previewing = false;
  error = '';

  difficultyColor: Record<string, string> = {
    basic: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.templateId = Number(this.route.snapshot.queryParamMap.get('templateId')) || null;
    if (this.templateId) {
      this.api.get<PdfTemplate>(`pdf/templates/${this.templateId}`).subscribe((t) => {
        this.template = t;
        this.cdr.detectChanges();
      });
    }
    this.api.get<Exercise[]>('exercises').subscribe((data) => {
      this.exercises = data;
      this.cdr.detectChanges();
    });
  }

  addSection(type: 'title' | 'text'): void {
    this.sections.push({
      id: this.nextId++,
      type,
      content: type === 'title' ? 'Nuevo título' : '',
    });
  }

  addExercise(ex: Exercise): void {
    this.sections.push({
      id: this.nextId++,
      type: 'exercise',
      content: '',
      exerciseId: ex.id,
      exerciseTitle: ex.title,
    });
    this.showExercisePicker = false;
    this.exerciseSearch = '';
  }

  removeSection(id: number): void {
    this.sections = this.sections.filter((s) => s.id !== id);
  }

  moveUp(index: number): void {
    if (index === 0) return;
    const arr = [...this.sections];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    this.sections = arr;
  }

  moveDown(index: number): void {
    if (index === this.sections.length - 1) return;
    const arr = [...this.sections];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    this.sections = arr;
  }

  get filteredExercises(): Exercise[] {
    const q = this.exerciseSearch.toLowerCase().trim();
    if (!q) return this.exercises;
    return this.exercises.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.topic?.name.toLowerCase().includes(q)
    );
  }

  preview(): void {
    if (!this.sections.length) {
      this.error = 'Agrega al menos una sección.';
      return;
    }
    this.error = '';
    this.previewing = true;
    this.api
      .post('pdf/preview', this.buildPayload())
      .subscribe({
        next: (res: any) => {
          this.previewing = false;
          window.open(res.url, '_blank');
        },
        error: () => {
          this.previewing = false;
          this.error = 'Error al generar el preview.';
        },
      });
  }

  generate(): void {
    if (!this.sections.length) {
      this.error = 'Agrega al menos una sección.';
      return;
    }
    this.error = '';
    this.generating = true;
    this.api
      .postBlob('pdf/generate', this.buildPayload())
      .subscribe({
        next: (blob) => {
          this.generating = false;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${this.documentTitle}.pdf`;
          a.click();
          URL.revokeObjectURL(url);
        },
        error: () => {
          this.generating = false;
          this.error = 'Error al generar el PDF.';
        },
      });
  }

  private buildPayload() {
    return {
      templateId: this.templateId,
      title: this.documentTitle,
      content: this.sections.map((s) => ({
        type: s.type,
        content: s.content,
        exerciseId: s.exerciseId,
      })),
    };
  }
}
