import { ChangeDetectorRef, Component, NgZone, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { MathOcrService } from '../../core/services/math-ocr.service';

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
    private mathOcr: MathOcrService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {}

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
    this.statusText = 'Iniciando...';

    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  async extract(): Promise<void> {
    if (!this.selectedFile) return;
    this.state = 'processing';
    this.progress = 2;
    this.statusText = 'Cargando motor OCR...';
    this.errorMsg = '';
    this.cdr.detectChanges();

    try {
      // Tesseract.js v7 ships createWorker on the default export.
      // Named destructuring fails with dynamic import on v7.
      const TesseractMod = await import('tesseract.js');
      const createWorker: Function =
        (TesseractMod as any).createWorker ??
        (TesseractMod as any).default?.createWorker;

      if (typeof createWorker !== 'function') {
        throw new Error('Tesseract.js no pudo cargarse (createWorker no encontrado)');
      }

      // langPath points to our own server (public/tessdata/) — no CDN dependency.
      // eng.traineddata.gz is served by nginx with Content-Encoding: gzip.
      const worker = await createWorker('eng', 1, {
        langPath: '/tessdata',
        logger: (m: any) => {
          // Logger runs outside Angular zone — NgZone.run() is required.
          this.ngZone.run(() => {
            switch (m.status) {
              case 'loading tesseract core':
                this.progress = 8;
                this.statusText = 'Cargando motor OCR...';
                break;
              case 'loading language traineddata':
                this.progress = 20;
                this.statusText = 'Cargando datos de idioma...';
                break;
              case 'initializing tesseract':
              case 'initializing api':
                this.progress = 30;
                this.statusText = 'Inicializando...';
                break;
              case 'recognizing text':
                this.progress = 30 + Math.round((m.progress ?? 0) * 55);
                this.statusText = 'Reconociendo texto...';
                break;
            }
            this.cdr.detectChanges();
          });
        },
      });

      // Timeout guard: if Tesseract hangs (CDN issue, WASM error), fail gracefully.
      const timeout$ = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 45_000)
      );

      const result = await Promise.race([
        (worker as any).recognize(this.selectedFile!),
        timeout$,
      ]) as any;

      await (worker as any).terminate();

      this.extractedText = (result?.data?.text ?? result?.text ?? '').trim();
      this.progress = 88;
      this.statusText = 'Convirtiendo a LaTeX...';
      this.cdr.detectChanges();

      // Step 2: client-side heuristic conversion (MathOcrService — zero external deps).
      this.extractedLatex = this.mathOcr.convert(this.extractedText);
      this.progress = 95;
      this.cdr.detectChanges();

      // Step 3: optional server-side verification pass.
      this.api.post<{ latex: string }>('ocr/convert', { text: this.extractedText })
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            if (res.latex && res.latex.length > this.extractedLatex.length) {
              this.extractedLatex = res.latex;
            }
            this.progress = 100;
            this.state = 'done';
            this.cdr.detectChanges();
          },
          error: () => {
            this.progress = 100;
            this.state = 'done';
            this.cdr.detectChanges();
          },
        });

    } catch (err: any) {
      console.error('[OCR] Error:', err);
      this.state = 'error';
      this.errorMsg = err?.message === 'timeout'
        ? 'Tiempo de espera agotado (45 s). Intenta con una imagen más pequeña o clara.'
        : `Error al procesar la imagen: ${err?.message ?? 'desconocido'}`;
      this.cdr.detectChanges();
    }
  }

  copyLatex(): void {
    navigator.clipboard.writeText(this.extractedLatex).then(() => {
      this.copied = true;
      this.cdr.detectChanges();
      setTimeout(() => {
        this.copied = false;
        this.cdr.detectChanges();
      }, 2000);
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
