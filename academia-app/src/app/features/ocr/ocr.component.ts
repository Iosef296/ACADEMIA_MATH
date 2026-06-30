import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';

type OcrState = 'idle' | 'processing' | 'done' | 'error';

@Component({
  selector: 'app-ocr',
  templateUrl: './ocr.component.html',
  standalone: false,
})
export class OcrComponent implements OnDestroy {
  state: OcrState = 'idle';

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  extractedText = '';
  extractedLatex = '';
  progress = 0;
  statusText = 'Iniciando...';
  errorMsg = '';

  copied = false;

  private destroy$ = new Subject<void>();

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.setFile(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) this.setFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private setFile(file: File): void {
    this.selectedFile = file;
    this.state = 'idle';
    this.extractedText = '';
    this.extractedLatex = '';
    this.errorMsg = '';
    this.progress = 0;
    this.statusText = 'Iniciando...';

    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  extract(): void {
    if (!this.selectedFile) return;
    this.state = 'processing';
    this.progress = 15;
    this.statusText = 'Analizando imagen con IA...';
    this.errorMsg = '';
    this.cdr.detectChanges();

    // Simulated progress while waiting for Gemini response
    const progressTimer = setInterval(() => {
      if (this.progress < 85) {
        this.progress += 5;
        this.cdr.detectChanges();
      }
    }, 800);

    this.api.upload<{ latex: string; text: string }>('ocr/extract', this.selectedFile)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          clearInterval(progressTimer);
          this.extractedText = res.text ?? res.latex ?? '';
          this.extractedLatex = res.latex ?? '';
          this.progress = 100;
          this.state = 'done';
          this.cdr.detectChanges();
        },
        error: (err) => {
          clearInterval(progressTimer);
          this.state = 'error';
          this.errorMsg = `Error al procesar: ${err?.error?.error ?? err?.message ?? 'desconocido'}`;
          this.cdr.detectChanges();
        },
      });
  }

  get latexLines(): string[] {
    return (this.extractedLatex || '').split('\n').filter(l => l.trim());
  }

  copyLatex(): void {
    navigator.clipboard.writeText(this.extractedLatex).then(() => {
      this.copied = true;
      this.cdr.detectChanges();
      setTimeout(() => { this.copied = false; this.cdr.detectChanges(); }, 2000);
    });
  }

  reset(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.extractedText = '';
    this.extractedLatex = '';
    this.state = 'idle';
    this.progress = 0;
    this.statusText = 'Iniciando...';
    this.errorMsg = '';
    this.cdr.detectChanges();
  }
}
