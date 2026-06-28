import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

interface QuestionBank {
  id: string;
  contentLatex: string;
  questionType: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: string;
  explanation?: string;
  difficulty: string;
  tags?: string;
  timesUsed: number;
  topic?: { id: string; name: string };
}

@Component({
  selector: 'app-question-bank-list',
  templateUrl: './question-bank-list.component.html',
  standalone: false,
})
export class QuestionBankListComponent implements OnInit {
  questions: QuestionBank[] = [];
  loading = false;
  error = '';
  filterDifficulty = '';
  searchQ = '';

  showForm = false;
  editingId: string | null = null;
  form: Partial<QuestionBank> & { topicId?: string } = this.emptyForm();

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const params: any = {};
    if (this.filterDifficulty) params['difficulty'] = this.filterDifficulty;
    if (this.searchQ) params['q'] = this.searchQ;
    this.api.get<QuestionBank[]>('question-bank', params).subscribe({
      next: (data) => { this.questions = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.error = 'Error cargando banco'; this.loading = false; this.cdr.detectChanges(); },
    });
  }

  openCreate(): void {
    this.form = this.emptyForm();
    this.editingId = null;
    this.showForm = true;
  }

  openEdit(q: QuestionBank): void {
    this.form = {
      contentLatex: q.contentLatex,
      questionType: q.questionType,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      difficulty: q.difficulty,
      tags: q.tags,
      topicId: q.topic?.id,
    };
    this.editingId = q.id;
    this.showForm = true;
  }

  save(): void {
    if (this.editingId) {
      this.api.put<QuestionBank>(`question-bank/${this.editingId}`, this.form).subscribe({
        next: () => { this.showForm = false; this.load(); },
        error: () => { this.error = 'Error guardando'; },
      });
    } else {
      this.api.post<QuestionBank>('question-bank', this.form).subscribe({
        next: () => { this.showForm = false; this.load(); },
        error: () => { this.error = 'Error creando'; },
      });
    }
  }

  delete(id: string): void {
    if (!confirm('¿Eliminar pregunta?')) return;
    this.api.delete(`question-bank/${id}`).subscribe({
      next: () => this.load(),
      error: () => { this.error = 'Error eliminando'; },
    });
  }

  cancel(): void {
    this.showForm = false;
    this.editingId = null;
  }

  private emptyForm(): Partial<QuestionBank> & { topicId?: string } {
    return { contentLatex: '', questionType: 'multiple_choice', correctAnswer: '', difficulty: 'medium' };
  }
}
