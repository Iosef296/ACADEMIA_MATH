import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
export class TemplateSelectorComponent implements OnInit {
  templates: PdfTemplate[] = [];
  loading = false;
  selected: PdfTemplate | null = null;

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.api.get<PdfTemplate[]>('pdf/templates').subscribe({
      next: (data) => {
        this.templates = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
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
