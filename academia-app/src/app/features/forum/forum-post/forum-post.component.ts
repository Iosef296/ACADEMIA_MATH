import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

interface Reply {
  id: number;
  body: string;
  author: { id: number; name: string };
  created_at: string;
  attachments: Attachment[];
}

interface Attachment {
  id: number;
  filename: string;
  url: string;
  type: 'image' | 'pdf' | 'latex';
}

interface Post {
  id: number;
  title: string;
  body: string;
  author: { id: number; name: string };
  topic: { id: number; name: string } | null;
  exercise: { id: number; title: string } | null;
  created_at: string;
  attachments: Attachment[];
  replies: Reply[];
}

@Component({
  selector: 'app-forum-post',
  templateUrl: './forum-post.component.html',
  standalone: false,
})
export class ForumPostComponent implements OnInit, OnDestroy {
  postId!: number;
  post: Post | null = null;
  loading = false;
  error = '';

  replyBody = '';
  replying = false;
  replyError = '';

  // Attachment upload
  selectedFile: File | null = null;
  uploading = false;

  private destroy$ = new Subject<void>();

  constructor(private route: ActivatedRoute, private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.postId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.api.get<Post>(`forum/posts/${this.postId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.post = data;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.error = 'No se pudo cargar la publicación.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  sendReply(): void {
    if (!this.replyBody.trim()) return;
    this.replying = true;
    this.replyError = '';

    this.api
      .post<Reply>(`forum/posts/${this.postId}/reply`, { body: this.replyBody })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (reply) => {
          this.post?.replies.push(reply);
          this.replyBody = '';
          this.replying = false;
        },
        error: () => {
          this.replyError = 'Error al enviar. Intenta de nuevo.';
          this.replying = false;
        },
      });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  uploadAttachment(): void {
    if (!this.selectedFile) return;
    this.uploading = true;

    this.api
      .upload<Attachment>(`forum/posts/${this.postId}/attachments`, this.selectedFile, 'file')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (att) => {
          this.post?.attachments.push(att);
          this.selectedFile = null;
          this.uploading = false;
        },
        error: () => {
          this.uploading = false;
        },
      });
  }

  isImage(att: Attachment): boolean {
    return att.type === 'image';
  }

  timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
  }
}
