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
  replyCount: number;
  acceptedReplyId: string | null;
  isAccepted: boolean;
  tags: string[];
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
}

interface PageResp {
  items: ForumPost[];
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
}

interface Stats {
  totalPosts: number;
  unanswered: number;
  topTags: { name: string; count: number }[];
}

type SortMode = 'recent' | 'liked' | 'unanswered' | 'solved';

@Component({
  selector: 'app-forum-list',
  templateUrl: './forum-list.component.html',
  standalone: false,
})
export class ForumListComponent implements OnInit, OnDestroy {
  posts: ForumPost[] = [];
  loading = false;
  loadingMore = false;
  searchQuery = '';
  topicFilter: string | null = null;
  tagFilter: string | null = null;
  sortMode: SortMode = 'recent';

  page = 0;
  size = 10;
  totalPages = 0;
  totalElements = 0;

  stats: Stats = { totalPosts: 0, unanswered: 0, topTags: [] };

  showNewPost = false;
  newTitle = '';
  newBody = '';
  newTagsInput = '';
  saving = false;
  error = '';

  currentUserId: string | null = null;
  deletingId: string | null = null;
  likingId: string | null = null;

  readonly sortTabs: { key: SortMode; label: string; icon: string }[] = [
    { key: 'recent',     label: 'Recientes',    icon: '🕒' },
    { key: 'liked',      label: 'Más gustados', icon: '🔥' },
    { key: 'unanswered', label: 'Sin responder', icon: '❓' },
    { key: 'solved',     label: 'Resueltos',    icon: '✓' },
  ];

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

    this.loadStats();

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (params) => {
          this.topicFilter = params['topicId'] ? String(params['topicId']) : null;
          this.tagFilter = params['tag'] ? String(params['tag']) : null;
          const s = params['sort'] as SortMode;
          this.sortMode = ['recent','liked','unanswered','solved'].includes(s) ? s : 'recent';
          this.reload();
        },
        error: (err) => console.error('Error reading query params:', err),
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadStats(): void {
    this.api.get<Stats>('forum/stats')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => { this.stats = data; this.cdr.detectChanges(); },
        error: (err) => console.error('Error loading stats:', err),
      });
  }

  reload(): void {
    this.page = 0;
    this.posts = [];
    this.load();
  }

  private buildParams(): Record<string, string> {
    const p: Record<string, string> = {
      page: String(this.page),
      size: String(this.size),
      sort: this.sortMode,
    };
    if (this.topicFilter) p['topicId'] = this.topicFilter;
    if (this.tagFilter) p['tag'] = this.tagFilter;
    return p;
  }

  load(): void {
    const first = this.page === 0;
    if (first) this.loading = true; else this.loadingMore = true;
    this.api.get<PageResp>('forum/page', this.buildParams())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (first) this.posts = data.items ?? [];
          else this.posts = [...this.posts, ...(data.items ?? [])];
          this.totalPages = data.totalPages;
          this.totalElements = data.totalElements;
          this.loading = false;
          this.loadingMore = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          this.loadingMore = false;
          this.cdr.detectChanges();
          console.error('Error loading forum posts:', err);
        },
      });
  }

  loadMore(): void {
    if (this.loadingMore || this.page + 1 >= this.totalPages) return;
    this.page++;
    this.load();
  }

  get hasMore(): boolean {
    return this.page + 1 < this.totalPages;
  }

  changeSort(mode: SortMode): void {
    this.router.navigate([], {
      queryParams: { sort: mode },
      queryParamsHandling: 'merge',
    });
  }

  selectTag(tag: string | null): void {
    this.router.navigate([], {
      queryParams: { tag: tag ?? null },
      queryParamsHandling: 'merge',
    });
  }

  get filtered(): ForumPost[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.posts;
    return this.posts.filter(
      (p) =>
        (p.title ?? '').toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q) ||
        (p.tags ?? []).some(t => t.toLowerCase().includes(q))
    );
  }

  isOwner(p: ForumPost): boolean {
    return !!this.currentUserId && p.author.id === this.currentUserId;
  }

  isSolved(p: ForumPost): boolean {
    return !!p.acceptedReplyId;
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

  onTagChipClick(event: Event, tag: string): void {
    event.preventDefault();
    event.stopPropagation();
    this.selectTag(tag);
  }

  private parseTags(input: string): string[] {
    return input.split(',')
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0 && s.length <= 50);
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
        tags: this.parseTags(this.newTagsInput),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.saving = false;
          this.showNewPost = false;
          this.newTitle = '';
          this.newBody = '';
          this.newTagsInput = '';
          this.loadStats();
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
