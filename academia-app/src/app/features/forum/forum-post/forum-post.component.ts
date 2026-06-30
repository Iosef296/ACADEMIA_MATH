import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';

interface Post {
  id: string;
  title: string | null;
  content: string;
  author: { id: string; name: string };
  topicId: string | null;
  exerciseId: string | null;
  parentId: string | null;
  replies: Post[];
  createdAt: string;
  updatedAt: string | null;
}

@Component({
  selector: 'app-forum-post',
  templateUrl: './forum-post.component.html',
  standalone: false,
})
export class ForumPostComponent implements OnInit, OnDestroy {
  postId!: string;
  post: Post | null = null;
  loading = false;
  error = '';

  replyBody = '';
  replying = false;
  replyError = '';

  currentUserId: string | null = null;

  editing = false;
  editTitle = '';
  editContent = '';
  saving = false;
  editError = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private store: Store,
  ) {}

  ngOnInit(): void {
    this.postId = String(this.route.snapshot.paramMap.get('id'));
    this.store.select(selectCurrentUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe(u => this.currentUserId = u?.id ?? null);
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading = true;
    this.api.get<Post>(`forum/${this.postId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.post = data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = 'No se pudo cargar la publicación.';
          this.loading = false;
          this.cdr.detectChanges();
          console.error('Error loading post:', err);
        },
      });
  }

  isOwner(): boolean {
    return !!this.currentUserId && this.post?.author.id === this.currentUserId;
  }

  startEdit(): void {
    if (!this.post) return;
    this.editing = true;
    this.editTitle = this.post.title ?? '';
    this.editContent = this.post.content;
    this.editError = '';
  }

  cancelEdit(): void {
    this.editing = false;
    this.editError = '';
  }

  saveEdit(): void {
    if (!this.post) return;
    if (!this.editContent.trim()) {
      this.editError = 'El contenido no puede estar vacío.';
      return;
    }
    this.saving = true;
    this.api
      .put<Post>(`forum/${this.post.id}`, {
        title: this.editTitle.trim() || null,
        content: this.editContent.trim(),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          if (this.post) {
            this.post.title = updated.title;
            this.post.content = updated.content;
            this.post.updatedAt = updated.updatedAt;
          }
          this.editing = false;
          this.saving = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.saving = false;
          this.editError = err?.status === 403
            ? 'Solo el autor puede editar este post.'
            : 'Error al guardar los cambios.';
          console.error('Error updating post:', err);
        },
      });
  }

  sendReply(): void {
    if (!this.replyBody.trim()) return;
    this.replying = true;
    this.replyError = '';

    this.api
      .post<Post>('forum', { content: this.replyBody.trim(), parentId: this.postId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reply) => {
          this.post?.replies.push(reply);
          this.replyBody = '';
          this.replying = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.replyError = 'Error al enviar. Intenta de nuevo.';
          this.replying = false;
          console.error('Error creating reply:', err);
        },
      });
  }

  wasEdited(p: Post): boolean {
    if (!p.updatedAt || !p.createdAt) return false;
    return new Date(p.updatedAt).getTime() - new Date(p.createdAt).getTime() > 1000;
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
