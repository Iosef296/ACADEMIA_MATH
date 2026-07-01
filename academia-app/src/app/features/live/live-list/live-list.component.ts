import { ChangeDetectorRef, Component, OnDestroy, OnInit, NgZone } from '@angular/core';
import { Subject, interval } from 'rxjs';
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
  scheduleMode = false;
  scheduledDate = '';
  scheduledTime = '';
  creating = false;

  // Accordion
  expandedCourse: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private store: Store,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
  ) {}

  ngOnInit(): void {
    this.store.select(selectCurrentUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe(u => this.user = u);

    this.loadSessions();
    this.requestNotificationPermission();

    // Poll every 60s to detect SCHEDULED → ACTIVE transitions
    interval(60000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.pollSessions());
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

  get scheduled(): LiveSession[] {
    return this.sessions
      .filter(s => s.status === 'SCHEDULED')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  get past(): LiveSession[] {
    return this.sessions.filter(s => s.status === 'ENDED');
  }

  get pastByCourse(): CourseGroup[] {
    const map = new Map<string, LiveSession[]>();
    for (const s of this.past) {
      const key = s.course || 'Sin curso';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
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

  private pollSessions(): void {
    const prevScheduledIds = new Set(this.scheduled.map(s => s.id));

    this.api.get<LiveSession[]>('live')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Detect newly activated sessions (were SCHEDULED, now ACTIVE)
          const newlyActive = data.filter(
            s => s.status === 'ACTIVE' && prevScheduledIds.has(s.id)
          );

          this.zone.run(() => {
            this.sessions = data;
            this.cdr.detectChanges();
          });

          newlyActive.forEach(s => this.sendNotification(s));
        },
      });
  }

  private requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  private sendNotification(session: LiveSession): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification('¡Clase en vivo iniciada!', {
      body: `${session.course ? session.course + ' — ' : ''}${session.title} está comenzando ahora.`,
      icon: '/favicon.ico',
    });
  }

  openCreateModal(): void {
    this.newTitle = '';
    this.newCourse = '';
    this.scheduleMode = false;
    this.scheduledDate = '';
    this.scheduledTime = '';
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.newTitle = '';
    this.newCourse = '';
    this.scheduleMode = false;
    this.scheduledDate = '';
    this.scheduledTime = '';
  }

  get minDate(): string {
    return new Date().toISOString().slice(0, 10);
  }

  get canCreate(): boolean {
    if (!this.newTitle.trim() || !this.newCourse) return false;
    if (this.scheduleMode && (!this.scheduledDate || !this.scheduledTime)) return false;
    return true;
  }

  createSession(): void {
    if (!this.canCreate) return;
    this.creating = true;

    let startTime: string | undefined;
    if (this.scheduleMode && this.scheduledDate && this.scheduledTime) {
      startTime = `${this.scheduledDate}T${this.scheduledTime}:00`;
    }

    const body: any = { title: this.newTitle.trim(), course: this.newCourse };
    if (startTime) body.startTime = startTime;

    this.api.post<LiveSession>('live', body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (session) => {
          this.creating = false;
          this.showCreateModal = false;
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

  cancelSession(session: LiveSession, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm('¿Cancelar esta sesión programada?')) return;

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

  formatScheduled(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-PE', {
      weekday: 'long', day: 'numeric', month: 'long',
    }) + ' a las ' + d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  timeUntil(dateStr: string): string {
    const diff = Math.floor((new Date(dateStr).getTime() - Date.now()) / 1000);
    if (diff <= 0) return 'en un momento';
    if (diff < 3600) return `en ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `en ${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}min`;
    return `en ${Math.floor(diff / 86400)}d`;
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
