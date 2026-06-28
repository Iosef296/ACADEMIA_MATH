import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { User } from '../../../store/auth/auth.state';

interface ProgressSummary {
  topic_name: string;
  xp: number;
  level: number;
  exercises_solved: number;
  error_count: number;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  reward_xp: number;
  end_date: string;
}

interface DashboardData {
  streak: number;
  totalXp: number;
  progressList: ProgressSummary[];
  activeChallenge: Challenge | null;
}

@Component({
  selector: 'app-student-dashboard',
  templateUrl: './student-dashboard.component.html',
  standalone: false,
})
export class StudentDashboardComponent implements OnInit {
  user$!: Observable<User | null>;
  streak = 0;
  totalXp = 0;
  progressList: ProgressSummary[] = [];
  activeChallenge: Challenge | null = null;
  loading = false;
  today = new Date();

  moods = [
    { value: 'happy', label: 'Feliz', emoji: '😊' },
    { value: 'motivated', label: 'Motivado', emoji: '💪' },
    { value: 'neutral', label: 'Normal', emoji: '😐' },
    { value: 'sad', label: 'Triste', emoji: '😔' },
    { value: 'stressed', label: 'Estresado', emoji: '😰' },
  ];
  selectedMood: string | null = null;
  moodSaved = false;
  Math = Math;

  constructor(private store: Store, private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.user$ = this.store.select(selectCurrentUser);
    this.loadDashboard();
  }

  loadDashboard(): void {
    forkJoin({
      streakRes: this.api.get<{ current: number }>('progress/streak').pipe(catchError(() => of(null))),
      progress: this.api.get<ProgressSummary[]>('progress').pipe(catchError(() => of([]))),
      challenges: this.api.get<Challenge[]>('gamification/challenges').pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ streakRes, progress, challenges }) => {
        this.streak = (streakRes as any)?.current ?? 0;
        this.progressList = (progress as ProgressSummary[]) ?? [];
        this.totalXp = this.progressList.reduce((sum, p) => sum + p.xp, 0);
        this.activeChallenge = (challenges as Challenge[])?.[0] ?? null;
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  saveMood(mood: string): void {
    if (this.moodSaved) return;
    this.selectedMood = mood;
    this.api.post('mood', { mood }).subscribe(() => {
      this.moodSaved = true;
    });
  }

  get topTopics(): ProgressSummary[] {
    return [...this.progressList]
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 5);
  }

  get errorTopics(): ProgressSummary[] {
    return [...this.progressList]
      .filter(p => p.error_count > 0)
      .sort((a, b) => b.error_count - a.error_count)
      .slice(0, 3);
  }
}
