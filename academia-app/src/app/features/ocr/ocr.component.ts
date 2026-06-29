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

  // ─── Image preprocessing para escritura a mano ────────────────────────────
  // Pipeline: escalar → mezcla de canales (suprimir cuadrícula) → umbral adaptativo local.
  //
  // Las líneas de cuadrícula azul tienen B alto y R bajo.
  // La mezcla 1.6R + 0.4G - 0.8B las empuja hacia blanco.
  // El umbral adaptativo por bloques maneja la iluminación desigual de la cámara.

  private preprocessHandwriting(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const src = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(src);

        const MIN_W = 1600;
        const MAX_W = 4000;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w < MIN_W) { const s = MIN_W / w; w = MIN_W; h = Math.round(h * s); }
        if (w > MAX_W) { const s = MAX_W / w; w = MAX_W; h = Math.round(h * s); }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const id = ctx.getImageData(0, 0, w, h);
        const d = id.data;
        const n = w * h;

        // Paso 1: mezcla de canales — suprime líneas de cuadrícula azul.
        // Cuadrícula R≈200 G≈220 B≈255 → valor alto (blanco)
        // Tinta      R≈40  G≈50  B≈120 → valor bajo  (negro)
        const gray = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
          gray[i] = Math.min(255, Math.max(0, 1.6 * r + 0.4 * g - 0.8 * b));
        }

        // Paso 2: umbral adaptativo local (bloques de 64px).
        // Umbral = 88% del promedio local → separa tinta del papel correctamente
        // sin importar si la foto está bien o mal iluminada en cada zona.
        const BLOCK = 64;
        const binary = new Uint8Array(n);
        const cols = Math.ceil(w / BLOCK);
        const rows = Math.ceil(h / BLOCK);

        for (let br = 0; br < rows; br++) {
          for (let bc = 0; bc < cols; bc++) {
            const x0 = bc * BLOCK, y0 = br * BLOCK;
            const x1 = Math.min(x0 + BLOCK, w);
            const y1 = Math.min(y0 + BLOCK, h);

            let sum = 0, cnt = 0;
            for (let y = y0; y < y1; y++) {
              for (let x = x0; x < x1; x++) {
                sum += gray[y * w + x]; cnt++;
              }
            }
            const localT = (sum / cnt) * 0.88;

            for (let y = y0; y < y1; y++) {
              for (let x = x0; x < x1; x++) {
                binary[y * w + x] = gray[y * w + x] <= localT ? 0 : 255;
              }
            }
          }
        }

        // Paso 3: escribir resultado binarizado.
        for (let i = 0; i < n; i++) {
          d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = binary[i];
          d[i * 4 + 3] = 255;
        }

        ctx.putImageData(id, 0, 0);
        canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error('Canvas toBlob falló')),
          'image/png',
        );
      };

      img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
      img.src = src;
    });
  }

  async extract(): Promise<void> {
    if (!this.selectedFile) return;
    this.state = 'processing';
    this.progress = 2;
    this.statusText = 'Preprocesando imagen...';
    this.errorMsg = '';
    this.cdr.detectChanges();

    try {
      // Step 1: preprocess for handwriting recognition.
      const processedBlob = await this.preprocessHandwriting(this.selectedFile);
      this.progress = 8;
      this.statusText = 'Cargando motor OCR...';
      this.cdr.detectChanges();

      // Tesseract.js v7 ships createWorker on the default export.
      const TesseractMod = await import('tesseract.js');
      const createWorker: Function =
        (TesseractMod as any).createWorker ??
        (TesseractMod as any).default?.createWorker;

      if (typeof createWorker !== 'function') {
        throw new Error('Tesseract.js no pudo cargarse (createWorker no encontrado)');
      }

      const worker = await createWorker('eng', 1, {
        langPath: '/tessdata',   // self-hosted, no CDN dependency
        logger: (m: any) => {
          this.ngZone.run(() => {
            switch (m.status) {
              case 'loading tesseract core':
                this.progress = 14;
                this.statusText = 'Cargando motor OCR...';
                break;
              case 'loading language traineddata':
                this.progress = 24;
                this.statusText = 'Cargando modelo de escritura...';
                break;
              case 'initializing tesseract':
              case 'initializing api':
                this.progress = 34;
                this.statusText = 'Inicializando...';
                break;
              case 'recognizing text':
                this.progress = 34 + Math.round((m.progress ?? 0) * 52);
                this.statusText = 'Reconociendo escritura...';
                break;
            }
            this.cdr.detectChanges();
          });
        },
      });

      // PSM 6 = bloque de texto uniforme. Mejor para páginas de cuaderno.
      await (worker as any).setParameters({
        tessedit_pageseg_mode: '6',
      });

      const timeout$ = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 60_000)
      );

      const result = await Promise.race([
        (worker as any).recognize(processedBlob),
        timeout$,
      ]) as any;

      await (worker as any).terminate();

      this.extractedText = (result?.data?.text ?? result?.text ?? '').trim();
      this.progress = 90;
      this.statusText = 'Convirtiendo a LaTeX...';
      this.cdr.detectChanges();

      this.extractedLatex = this.mathOcr.convert(this.extractedText);
      this.progress = 96;
      this.cdr.detectChanges();

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
        ? 'Tiempo de espera agotado (60 s). Intenta con una imagen más pequeña.'
        : `Error al procesar: ${err?.message ?? 'desconocido'}`;
      this.cdr.detectChanges();
    }
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
