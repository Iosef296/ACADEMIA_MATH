import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';

interface ForumPost {
  id: string;
  title: string | null;
  content: string;
  author: { id: string; name: string };
  topicId: string | null;
  exerciseId: string | null;
  parentId: string | null;
  replies: ForumPost[];
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-forum-list',
  templateUrl: './forum-list.component.html',
  standalone: false,
})
export class ForumListComponent implements OnInit, OnDestroy {
  posts: ForumPost[] = [];
  loading = false;
  searchQuery = '';
  topicFilter: string | null = null;

  showNewPost = false;
  newTitle = '';
  newBody = '';
  saving = false;
  error = '';

  currentUserId: string | null = null;
  deletingId: string | null = null;
  likingId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private store: Store,
  ) {}

  ngOnInit(): void {
    this.store.select(selectCurrentUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe(u => this.currentUserId = u?.id ?? null);

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (params) => {
          this.topicFilter = params['topicId'] ? String(params['topicId']) : null;
          this.load();
        },
        error: (err) => console.error('Error reading query params:', err),
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading = true;
    const query = this.topicFilter ? `?topicId=${this.topicFilter}` : '';
    this.api.get<ForumPost[]>(`forum${query}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.posts = data ?? [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          this.cdr.detectChanges();
          console.error('Error loading forum posts:', err);
        },
      });
  }

  get filtered(): ForumPost[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.posts;
    return this.posts.filter(
      (p) =>
        (p.title ?? '').toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q)
    );
  }

  replyCount(p: ForumPost): number {
    return p.replies?.length ?? 0;
  }

  isOwner(p: ForumPost): boolean {
    return !!this.currentUserId && p.author.id === this.currentUserId;
  }

  deletePost(event: Event, p: ForumPost): void {
    event.preventDefault();
    event.stopPropagation();
    if (!confirm('¿Eliminar esta publicación? Esta acción no se puede deshacer.')) return;
    this.deletingId = p.id;
    this.api.delete<void>(`forum/${p.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.posts = this.posts.filter(x => x.id !== p.id);
          this.deletingId = null;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.deletingId = null;
          console.error('Error deleting post:', err);
          alert(err?.status === 403
            ? 'Solo el autor puede eliminar este post.'
            : 'Error al eliminar. Intenta de nuevo.');
        },
      });
  }

  toggleLike(event: Event, p: ForumPost): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.likingId) return;
    this.likingId = p.id;
    this.api.post<ForumPost>(`forum/${p.id}/like`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          p.likeCount = updated.likeCount;
          p.likedByMe = updated.likedByMe;
          this.likingId = null;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.likingId = null;
          console.error('Error toggling like:', err);
        },
      });
  }

  createPost(): void {
    if (!this.newTitle.trim() || !this.newBody.trim()) {
      this.error = 'El título y el contenido son obligatorios.';
      return;
    }
    this.error = '';
    this.saving = true;
    this.api
      .post<ForumPost>('forum', {
        title: this.newTitle.trim(),
        content: this.newBody.trim(),
        topicId: this.topicFilter,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.saving = false;
          this.showNewPost = false;
          this.newTitle = '';
          this.newBody = '';
          this.router.navigate(['/forum', res.id]);
        },
        error: (err) => {
          this.saving = false;
          this.error = 'Error al publicar. Intenta de nuevo.';
          console.error('Error creating post:', err);
        },
      });
  }

  timeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
  }
}
