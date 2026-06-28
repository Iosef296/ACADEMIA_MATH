import { Component } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

type OcrMode = 'upload' | 'camera';
type OcrState = 'idle' | 'processing' | 'done' | 'error';

@Component({
  selector: 'app-ocr',
  templateUrl: './ocr.component.html',
  standalone: false,
})
export class OcrComponent {
  mode: OcrMode = 'upload';
  state: OcrState = 'idle';

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  extractedText = '';
  extractedLatex = '';
  progress = 0;
  errorMsg = '';

  copied = false;

  constructor(private api: ApiService) {}

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
      // Client-side OCR with Tesseract.js
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('spa', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            this.progress = Math.round(m.progress * 80);
          }
        },
      });

      const { data } = await worker.recognize(this.selectedFile);
      await worker.terminate();

      this.extractedText = data.text.trim();
      this.progress = 90;

      // Send to backend for LaTeX conversion
      this.api
        .upload<{ latex: string }>('ocr/extract', this.selectedFile, 'image')
        .subscribe({
          next: (res) => {
            this.extractedLatex = res.latex;
            this.progress = 100;
            this.state = 'done';
          },
          error: () => {
            // Fallback: use raw text if backend fails
            this.extractedLatex = this.extractedText;
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
