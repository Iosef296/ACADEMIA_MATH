import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, forkJoin, of } from 'rxjs';
import { timeout, catchError, takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

interface Topic {
  id: string;
  name: string;
  description: string;
  order: number;
  is_locked: boolean;
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
  progressMap: Map<string, ProgressSummary> = new Map();
  loading = false;
  error = '';
  searchQuery = '';
  Math = Math;

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

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loading = true;
    forkJoin({
      topics:   this.api.get<Topic[]>('topics').pipe(timeout(15000), catchError(() => of([] as Topic[]))),
      progress: this.api.get<ProgressSummary[]>('progress').pipe(catchError(() => of([] as ProgressSummary[]))),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ topics, progress }) => {
          this.topics = Array.isArray(topics) ? topics : [];
          const map = new Map<string, ProgressSummary>();
          (progress as ProgressSummary[]).forEach(p => map.set(p.topic_name?.toLowerCase(), p));
          this.progressMap = map;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => { this.loading = false; this.cdr.detectChanges(); },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get filtered(): Topic[] {
    if (!this.searchQuery.trim()) return this.topics;
    const q = this.searchQuery.toLowerCase();
    return this.topics.filter(
      t => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)
        || t.children?.some(c => c.name.toLowerCase().includes(q))
    );
  }

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

  get totalTopics(): number { return this.topics.length; }
  get exploredTopics(): number { return this.progressMap.size; }
}
