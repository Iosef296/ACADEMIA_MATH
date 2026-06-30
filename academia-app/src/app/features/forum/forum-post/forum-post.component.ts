import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

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

  private destroy$ = new Subject<void>();

  constructor(private route: ActivatedRoute, private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.postId = String(this.route.snapshot.paramMap.get('id'));
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

  timeAgo(dateStr: string): string {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
  }
}
</content>
</invoke>