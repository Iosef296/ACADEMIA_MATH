import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';

interface Step {
  order: number;
  title: string | null;
  content: string;
}

interface Post {
  id: string;
  title: string | null;
  content: string;
  author: { id: string; name: string };
  topicId: string | null;
  exerciseId: string | null;
  parentId: string | null;
  replies: Post[];
  steps: Step[];
  replyCount: number;
  acceptedReplyId: string | null;
  isAccepted: boolean;
  tags: string[];
  likeCount: number;
  likedByMe: boolean;
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
  replyMode: 'simple' | 'steps' = 'simple';
  replySteps: { title: string; content: string }[] = [{ title: '', content: '' }];
  copiedStepKey: string | null = null;

  currentUserId: string | null = null;

  editing = false;
  editTitle = '';
  editContent = '';
  editTagsInput = '';
  saving = false;
  editError = '';

  deleting = false;
  likingId: string | null = null;
  acceptingId: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
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
          this.scrollToHash();
        },
        error: (err) => {
          this.error = 'No se pudo cargar la publicación.';
          this.loading = false;
          this.cdr.detectChanges();
          console.error('Error loading post:', err);
        },
      });
  }

  isOwner(authorId?: string | null): boolean {
    return !!this.currentUserId && !!authorId && authorId === this.currentUserId;
  }

  startEdit(): void {
    if (!this.post) return;
    this.editing = true;
    this.editTitle = this.post.title ?? '';
    this.editContent = this.post.content;
    this.editTagsInput = (this.post.tags ?? []).join(', ');
    this.editError = '';
  }

  goToTag(tag: string): void {
    this.router.navigate(['/forum'], { queryParams: { tag } });
  }

  private parseTags(input: string): string[] {
    return input.split(',')
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 0 && s.length <= 50);
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
        tags: this.parseTags(this.editTagsInput),
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          if (this.post) {
            this.post.title = updated.title;
            this.post.content = updated.content;
            this.post.tags = updated.tags ?? [];
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

  deletePost(): void {
    if (!this.post) return;
    if (!confirm('¿Eliminar esta publicación y todas sus respuestas? Esta acción no se puede deshacer.')) return;
    this.deleting = true;
    this.api.delete<void>(`forum/${this.post.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deleting = false;
          this.router.navigate(['/forum']);
        },
        error: (err) => {
          this.deleting = false;
          console.error('Error deleting post:', err);
          alert(err?.status === 403
            ? 'Solo el autor puede eliminar este post.'
            : 'Error al eliminar. Intenta de nuevo.');
        },
      });
  }

  deleteReply(reply: Post): void {
    if (!this.post) return;
    if (!confirm('¿Eliminar esta respuesta?')) return;
    this.api.delete<void>(`forum/${reply.id}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (this.post) {
            this.post.replies = this.post.replies.filter(r => r.id !== reply.id);
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('Error deleting reply:', err);
          alert(err?.status === 403
            ? 'Solo el autor puede eliminar esta respuesta.'
            : 'Error al eliminar. Intenta de nuevo.');
        },
      });
  }

  isPostAuthor(): boolean {
    return this.isOwner(this.post?.author.id);
  }

  get sortedReplies(): Post[] {
    if (!this.post) return [];
    const replies = [...this.post.replies];
    if (this.post.acceptedReplyId) {
      const idx = replies.findIndex(r => r.id === this.post!.acceptedReplyId);
      if (idx > 0) {
        const [accepted] = replies.splice(idx, 1);
        replies.unshift(accepted);
      }
    }
    return replies;
  }

  acceptReply(reply: Post): void {
    if (!this.post) return;
    this.acceptingId = reply.id;
    this.api.post<Post>(`forum/${this.post.id}/accept/${reply.id}`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          if (this.post) this.post.acceptedReplyId = updated.acceptedReplyId;
          this.acceptingId = null;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.acceptingId = null;
          console.error('Error accepting reply:', err);
          alert('No se pudo marcar la mejor respuesta.');
        },
      });
  }

  unacceptReply(): void {
    if (!this.post) return;
    this.acceptingId = 'unset';
    this.api.delete<Post>(`forum/${this.post.id}/accept`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          if (this.post) this.post.acceptedReplyId = updated.acceptedReplyId;
          this.acceptingId = null;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.acceptingId = null;
          console.error('Error unaccepting reply:', err);
        },
      });
  }

  isAcceptedReply(reply: Post): boolean {
    return !!this.post?.acceptedReplyId && this.post.acceptedReplyId === reply.id;
  }

  toggleLike(target: Post): void {
    if (this.likingId) return;
    this.likingId = target.id;
    this.api.post<Post>(`forum/${target.id}/like`, {})
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          target.likeCount = updated.likeCount;
          target.likedByMe = updated.likedByMe;
          this.likingId = null;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.likingId = null;
          console.error('Error toggling like:', err);
        },
      });
  }

  addStep(): void {
    this.replySteps.push({ title: '', content: '' });
  }

  removeStep(idx: number): void {
    if (this.replySteps.length === 1) {
      this.replySteps[0] = { title: '', content: '' };
    } else {
      this.replySteps.splice(idx, 1);
    }
  }

  moveStep(idx: number, dir: -1 | 1): void {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= this.replySteps.length) return;
    const [item] = this.replySteps.splice(idx, 1);
    this.replySteps.splice(newIdx, 0, item);
  }

  setReplyMode(mode: 'simple' | 'steps'): void {
    this.replyMode = mode;
    if (mode === 'steps' && this.replySteps.length === 0) {
      this.replySteps = [{ title: '', content: '' }];
    }
  }

  sendReply(): void {
    const inStepMode = this.replyMode === 'steps';
    const steps = inStepMode
      ? this.replySteps
          .map(s => ({ title: (s.title || '').trim() || null, content: (s.content || '').trim() }))
          .filter(s => s.content.length > 0)
      : [];

    if (inStepMode && steps.length === 0) {
      this.replyError = 'Añade al menos un paso con contenido.';
      return;
    }
    if (!inStepMode && !this.replyBody.trim()) return;

    this.replying = true;
    this.replyError = '';

    const body: any = { parentId: this.postId };
    if (inStepMode) {
      body.content = '';
      body.steps = steps.map((s, i) => ({ order: i + 1, ...s }));
    } else {
      body.content = this.replyBody.trim();
    }

    this.api
      .post<Post>('forum', body)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reply) => {
          this.post?.replies.push(reply);
          this.replyBody = '';
          this.replySteps = [{ title: '', content: '' }];
          this.replyMode = 'simple';
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

  applyFormat(field: 'body' | number, format: 'bold' | 'italic' | 'code' | 'codeblock' | 'list'): void {
    const wraps: Record<string, [string, string]> = {
      bold:      ['**', '**'],
      italic:    ['*', '*'],
      code:      ['`', '`'],
      codeblock: ['\n```\n', '\n```\n'],
      list:      ['\n- ', ''],
    };
    const [pre, post] = wraps[format];
    const insert = (current: string) => current + pre + 'texto' + post;
    if (field === 'body') {
      this.replyBody = insert(this.replyBody || '');
    } else {
      const step = this.replySteps[field];
      if (step) step.content = insert(step.content || '');
    }
  }

  copyStepLink(replyId: string, order: number): void {
    const url = `${window.location.origin}${window.location.pathname}#reply-${replyId}-paso-${order}`;
    const key = `${replyId}-${order}`;
    navigator.clipboard.writeText(url).then(() => {
      this.copiedStepKey = key;
      setTimeout(() => {
        if (this.copiedStepKey === key) {
          this.copiedStepKey = null;
          this.cdr.detectChanges();
        }
      }, 1500);
      this.cdr.detectChanges();
    }).catch(err => console.error('Clipboard error:', err));
  }

  scrollToHash(): void {
    const hash = window.location.hash?.replace('#', '');
    if (!hash) return;
    setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-yellow-300', 'transition');
        setTimeout(() => el.classList.remove('ring-4', 'ring-yellow-300'), 2500);
      }
    }, 300);
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
