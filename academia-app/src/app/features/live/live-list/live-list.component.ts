import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { ApiService } from '../../../core/services/api.service';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { User } from '../../../store/auth/auth.state';

export interface LiveSession {
  id: string;
  title: string;
  course?: string;
  jitsiRoomId: string;
  teacherId: string;
  teacherName: string;
  startTime: string;
  endTime: string | null;
  status: string;
  createdAt: string;
}

export interface CourseGroup {
  course: string;
  sessions: LiveSession[];
}

export const COURSES = ['Álgebra', 'Cálculo', 'Aritmética', 'Geometría', 'Estadística'];

@Component({
  selector: 'app-live-list',
  templateUrl: './live-list.component.html',
  standalone: false,
})
export class LiveListComponent implements OnInit, OnDestroy {
  sessions: LiveSession[] = [];
  loading = true;
  user: User | null = null;

  readonly courses = COURSES;

  // Create form
  showCreateModal = false;
  newTitle = '';
  newCourse = '';
  creating = false;

  // Accordion state for past sessions
  expandedCourse: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private store: Store,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.store.select(selectCurrentUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe(u => this.user = u);

    this.loadSessions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isTeacher(): boolean {
    return this.user?.role === 'teacher' || this.user?.role === 'admin';
  }

  get active(): LiveSession[] {
    return this.sessions.filter(s => s.status === 'ACTIVE');
  }

  get past(): LiveSession[] {
    return this.sessions.filter(s => s.status !== 'ACTIVE');
  }

  get pastByCourse(): CourseGroup[] {
    const map = new Map<string, LiveSession[]>();
    for (const s of this.past) {
      const key = s.course || 'Sin curso';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    // Order: predefined courses first, then 'Sin curso'
    const ordered: CourseGroup[] = [];
    for (const c of COURSES) {
      if (map.has(c)) ordered.push({ course: c, sessions: map.get(c)! });
    }
    if (map.has('Sin curso')) ordered.push({ course: 'Sin curso', sessions: map.get('Sin curso')! });
    return ordered;
  }

  toggleCourse(course: string): void {
    this.expandedCourse = this.expandedCourse === course ? null : course;
  }

  loadSessions(): void {
    this.loading = true;
    this.api.get<LiveSession[]>('live')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.sessions = data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  openCreateModal(): void {
    this.newTitle = '';
    this.newCourse = '';
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.newTitle = '';
    this.newCourse = '';
  }

  createSession(): void {
    if (!this.newTitle.trim() || !this.newCourse) return;
    this.creating = true;

    this.api.post<LiveSession>('live', { title: this.newTitle.trim(), course: this.newCourse })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (session) => {
          this.creating = false;
          this.showCreateModal = false;
          this.newTitle = '';
          this.newCourse = '';
          this.sessions.unshift(session);
          this.cdr.detectChanges();
        },
        error: () => {
          this.creating = false;
          this.cdr.detectChanges();
        },
      });
  }

  endSession(session: LiveSession, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!confirm('¿Estás seguro de que deseas finalizar esta sesión?')) return;

    this.api.patch<LiveSession>(`live/${session.id}/status`, { status: 'ENDED' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          const idx = this.sessions.findIndex(s => s.id === session.id);
          if (idx !== -1) this.sessions[idx] = updated;
          this.cdr.detectChanges();
        },
      });
  }

  isOwner(session: LiveSession): boolean {
    return !!this.user && this.user.id === session.teacherId;
  }

  timeAgo(dateStr: string | null): string {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
  }
}
