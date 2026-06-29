import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';

export interface PdfTemplate {
  id: number;
  name: string;
  config?: {
    logoUrl?: string;
    primaryColor?: string;
    header?: string;
    footer?: string;
  };
}

@Component({
  selector: 'app-template-selector',
  templateUrl: './template-selector.component.html',
  standalone: false,
})
export class TemplateSelectorComponent implements OnInit, OnDestroy {
  templates: PdfTemplate[] = [];
  loading = false;
  selected: PdfTemplate | null = null;

  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.api.get<PdfTemplate[]>('pdf/templates')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.templates = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  select(t: PdfTemplate): void {
    this.selected = t;
  }

  confirm(): void {
    if (!this.selected) return;
    this.router.navigate(['/pdf/builder'], {
      queryParams: { templateId: this.selected.id },
    });
  }
}
