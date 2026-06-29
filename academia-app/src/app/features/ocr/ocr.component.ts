import { Component, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { MathOcrService } from '../../core/services/math-ocr.service';

type OcrMode = 'upload' | 'camera';
type OcrState = 'idle' | 'processing' | 'done' | 'error';

@Component({
  selector: 'app-ocr',
  templateUrl: './ocr.component.html',
  standalone: false,
})
export class OcrComponent implements OnDestroy {
  mode: OcrMode = 'upload';
  state: OcrState = 'idle';

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  extractedText = '';
  extractedLatex = '';
  progress = 0;
  errorMsg = '';

  copied = false;

  private destroy$ = new Subject<void>();

  constructor(private api: ApiService, private mathOcr: MathOcrService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.setFile(file);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('image/')) {
      this.setFile(file);
    }
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

    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  async extract(): Promise<void> {
    if (!this.selectedFile) return;
    this.state = 'processing';
    this.progress = 0;
    this.errorMsg = '';

    try {
      // Step 1: client-side OCR with Tesseract.js
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('spa', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            this.progress = Math.round(m.progress * 70);
          }
        },
      });

      const { data } = await worker.recognize(this.selectedFile);
      await worker.terminate();

      this.extractedText = data.text.trim();
      this.progress = 75;

      // Step 2: client-side heuristic conversion (MathOcrService — zero external deps)
      this.extractedLatex = this.mathOcr.convert(this.extractedText);
      this.progress = 85;

      // Step 3: server-side conversion pass (same algorithm in Java, for verification)
      this.api.post<{ latex: string }>('ocr/convert', { text: this.extractedText })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            // Use server result only if it produces a longer/richer conversion
            if (res.latex && res.latex.length > this.extractedLatex.length) {
              this.extractedLatex = res.latex;
            }
            this.progress = 100;
            this.state = 'done';
          },
          error: () => {
            // Server pass failed — client result is still valid
            this.progress = 100;
            this.state = 'done';
          },
        });

    } catch {
      this.state = 'error';
      this.errorMsg = 'Error al procesar la imagen. Verifica que sea legible.';
    }
  }

  copyLatex(): void {
    navigator.clipboard.writeText(this.extractedLatex).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    });
  }

  reset(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    this.extractedText = '';
    this.extractedLatex = '';
    this.state = 'idle';
    this.progress = 0;
    this.errorMsg = '';
  }
}
