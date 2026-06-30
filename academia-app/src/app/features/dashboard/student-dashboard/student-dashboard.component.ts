import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
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
export class StudentDashboardComponent implements OnInit, OnDestroy {
  user$!: Observable<User | null>;
  streak = 0;
  totalXp = 0;
  progressList: ProgressSummary[] = [];
  activeChallenge: Challenge | null = null;
  loading = false;
  today = new Date();

  moods = [
    { value: 'motivated', label: 'Motivado', emoji: '💪', difficulty: 'advanced' },
    { value: 'neutral',   label: 'Normal',   emoji: '😐', difficulty: 'intermediate' },
    { value: 'stressed',  label: 'Estresado', emoji: '😰', difficulty: 'basic' },
  ];
  selectedMood: string | null = null;
  moodSaved = false;
  showMoodModal = true;
  Math = Math;

  private destroy$ = new Subject<void>();

  constructor(private store: Store, private api: ApiService, private cdr: ChangeDetectorRef, private router: Router) {}

  ngOnInit(): void {
    this.user$ = this.store.select(selectCurrentUser);
    this.user$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) this.loadDashboard();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboard(): void {
    forkJoin({
      streakRes: this.api.get<{ current: number }>('progress/streak').pipe(catchError(() => of(null))),
      progress: this.api.get<ProgressSummary[]>('progress').pipe(catchError(() => of([]))),
      challenges: this.api.get<Challenge[]>('gamification/challenges').pipe(catchError(() => of([]))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ streakRes, progress, challenges }) => {
          this.streak = (streakRes as any)?.current ?? 0;
          this.progressList = (progress as ProgressSummary[]) ?? [];
          this.totalXp = this.progressList.reduce((sum, p) => sum + p.xp, 0);
          this.activeChallenge = (challenges as Challenge[])?.[0] ?? null;
          this.cdr.detectChanges();
        },
        error: (err) => console.error('Error loading dashboard:', err),
      });
  }

  saveMood(mood: string): void {
    if (this.moodSaved) return;
    this.selectedMood = mood;
    this.showMoodModal = false;
    localStorage.setItem('moodAnsweredDate', new Date().toDateString());
    this.api.post('mood', { mood }).pipe(takeUntil(this.destroy$)).subscribe({ error: (err) => console.error('Error saving mood:', err) });
    const difficulty = this.moods.find(m => m.value === mood)?.difficulty ?? 'intermediate';
    this.router.navigate(['/exercises'], { queryParams: { difficulty } });
  }

  closeMoodModal(): void {
    this.showMoodModal = false;
    localStorage.setItem('moodAnsweredDate', new Date().toDateString());
  }

  get topTopics(): ProgressSummary[] {
    return [...this.progressList].sort((a, b) => b.xp - a.xp).slice(0, 5);
  }

  get errorTopics(): ProgressSummary[] {
    return [...this.progressList]
      .filter(p => p.error_count > 0)
      .sort((a, b) => b.error_count - a.error_count)
      .slice(0, 3);
  }

  get totalExercisesSolved(): number {
    return this.progressList.reduce((sum, p) => sum + p.exercises_solved, 0);
  }

  get currentLevel(): number {
    return Math.floor(this.totalXp / 100) + 1;
  }
}
