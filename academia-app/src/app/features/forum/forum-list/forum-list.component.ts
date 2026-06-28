import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface ForumPost {
  id: number;
  title: string;
  body: string;
  author: { id: number; name: string };
  topic: { id: number; name: string } | null;
  exercise: { id: number; title: string } | null;
  reply_count: number;
  created_at: string;
  has_attachments: boolean;
}

@Component({
  selector: 'app-forum-list',
  templateUrl: './forum-list.component.html',
  standalone: false,
})
export class ForumListComponent implements OnInit {
  posts: ForumPost[] = [];
  loading = false;
  searchQuery = '';
  topicFilter: number | null = null;

  showNewPost = false;
  newTitle = '';
  newBody = '';
  saving = false;
  error = '';

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.topicFilter = params['topicId'] ? Number(params['topicId']) : null;
      this.load();
    });
  }

  load(): void {
    const query = this.topicFilter ? `?topicId=${this.topicFilter}` : '';
    this.api.get<ForumPost[]>(`forum/posts${query}`).subscribe({
      next: (data) => {
        this.posts = data;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  get filtered(): ForumPost[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.posts;
    return this.posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q) ||
        p.topic?.name.toLowerCase().includes(q)
    );
  }

  createPost(): void {
    if (!this.newTitle.trim() || !this.newBody.trim()) {
      this.error = 'El título y el contenido son obligatorios.';
      return;
    }
    this.error = '';
    this.saving = true;
    this.api
      .post<any>('forum/posts', {
        title: this.newTitle,
        body: this.newBody,
        topicId: this.topicFilter,
      })
      .subscribe({
        next: (res) => {
          this.saving = false;
          this.showNewPost = false;
          this.newTitle = '';
          this.newBody = '';
          this.router.navigate(['/forum', res.id]);
        },
        error: () => {
          this.saving = false;
          this.error = 'Error al publicar. Intenta de nuevo.';
        },
      });
  }

  timeAgo(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'hace un momento';
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return `hace ${Math.floor(diff / 86400)}d`;
  }
}
