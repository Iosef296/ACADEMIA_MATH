import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface Exercise {
  id: string;
  title: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  is_parametric: boolean;
  needs_graph: boolean;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  is_locked: boolean;
  children?: Topic[];
}

interface Progress {
  xp: number;
  level: number;
  exercises_solved: number;
  error_count: number;
}

@Component({
  selector: 'app-topic-detail',
  templateUrl: './topic-detail.component.html',
  standalone: false,
})
export class TopicDetailComponent implements OnInit {
  topicId = '';
  topic: Topic | null = null;
  exercises: Exercise[] = [];
  progress: Progress | null = null;
  loading = false;

  difficultyLabel: Record<string, string> = {
    basic: 'Básico',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
  };

  difficultyColor: Record<string, string> = {
    basic: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

  constructor(private route: ActivatedRoute, private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.topicId = this.route.snapshot.paramMap.get('id') ?? '';
    Promise.all([
      this.api.get<Topic>(`topics/${this.topicId}`).toPromise(),
      this.api.get<Exercise[]>(`exercises?topicId=${this.topicId}`).toPromise(),
      this.api.get<Progress>(`progress/topics/${this.topicId}`).toPromise(),
    ]).then(([topic, exercises, progress]) => {
      this.topic = topic ?? null;
      this.exercises = exercises ?? [];
      this.progress = progress ?? null;
      this.loading = false;
      this.cdr.detectChanges();
    }).catch(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }

  get xpToNextLevel(): number {
    if (!this.progress) return 100;
    return 100 - (this.progress.xp % 100);
  }

  get xpPercent(): number {
    if (!this.progress) return 0;
    return this.progress.xp % 100;
  }
}
