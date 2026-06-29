import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  OnChanges,
} from '@angular/core';

export type GraphLevel = 'auto' | 'template' | 'manual';

export interface GraphConfig {
  level: GraphLevel;
  expression?: string;
  templateType?: string;
  templateParams?: Record<string, any>;
  canvasData?: any;
}

@Component({
  selector: 'app-graph-editor',
  templateUrl: './graph-editor.component.html',
  standalone: false,
})
export class GraphEditorComponent implements AfterViewInit, OnDestroy, OnChanges {
  @ViewChild('plotContainer') plotRef!: ElementRef;
  @ViewChild('canvasContainer') canvasRef!: ElementRef;

  @Input() initialConfig: GraphConfig | null = null;
  @Output() configChange = new EventEmitter<GraphConfig>();

  level: GraphLevel = 'auto';
  expression = 'sin(x)';
  templateType = 'triangle';
  templateParams: Record<string, string> = { base: '4', height: '3' };
  plotRendered = false;

  // Level 1: function templates
  functionExamples = [
    { label: 'sen(x)', value: 'sin(x)' },
    { label: 'cos(x)', value: 'cos(x)' },
    { label: 'x²', value: 'x^2' },
    { label: 'x³ - 2x', value: 'x^3 - 2*x' },
    { label: '√x', value: 'sqrt(x)' },
    { label: '1/x', value: '1/x' },
  ];

  // Level 2: geometry templates
  templates = [
    { value: 'triangle', label: 'Triángulo', params: ['base', 'height'] },
    { value: 'circle', label: 'Círculo', params: ['radius'] },
    { value: 'rectangle', label: 'Rectángulo', params: ['width', 'height'] },
  ];

  private plotly: any = null;
  private stageDestroy: (() => void) | null = null;

  ngAfterViewInit(): void {
    if (this.initialConfig) {
      this.level = this.initialConfig.level;
      this.expression = this.initialConfig.expression ?? 'sin(x)';
    }
    if (this.level === 'auto') {
      setTimeout(() => this.renderPlot(), 100);
    }
  }

  ngOnChanges(): void {}

  setLevel(l: string): void {
    this.level = l as GraphLevel;
    this.destroyCanvas();
    setTimeout(() => {
      if (l === 'auto') this.renderPlot();
      if (l === 'template') this.renderTemplate();
      if (l === 'manual') this.initCanvas();
    }, 100);
  }

  async renderPlot(): Promise<void> {
    if (!this.plotRef) return;
    const PlotlyModule = await import('plotly.js-dist-min' as any);
    const Plotly = PlotlyModule.default ?? PlotlyModule;
    this.plotly = Plotly;

    const xValues: number[] = [];
    const yValues: number[] = [];
    for (let x = -10; x <= 10; x += 0.1) {
      try {
        const y = this.evalExpression(this.expression, x);
        if (isFinite(y)) {
          xValues.push(Math.round(x * 100) / 100);
          yValues.push(y);
        }
      } catch {}
    }

    Plotly.react(
      this.plotRef.nativeElement,
      [{ x: xValues, y: yValues, type: 'scatter', mode: 'lines', line: { color: '#2563eb', width: 2 } }],
      {
        margin: { t: 20, r: 20, b: 40, l: 40 },
        xaxis: { zeroline: true, zerolinecolor: '#9ca3af', gridcolor: '#f3f4f6' },
        yaxis: { zeroline: true, zerolinecolor: '#9ca3af', gridcolor: '#f3f4f6' },
        paper_bgcolor: '#ffffff',
        plot_bgcolor: '#ffffff',
        height: 280,
      },
      { responsive: true, displayModeBar: false }
    );
    this.plotRendered = true;
    this.emit();
  }

  private evalExpression(expr: string, x: number): number {
    const safe = expr
      .replace(/\^/g, '**')
      .replace(/sin/g, 'Math.sin')
      .replace(/cos/g, 'Math.cos')
      .replace(/tan/g, 'Math.tan')
      .replace(/sqrt/g, 'Math.sqrt')
      .replace(/log/g, 'Math.log')
      .replace(/abs/g, 'Math.abs')
      .replace(/pi/g, 'Math.PI')
      .replace(/e(?![a-zA-Z])/g, 'Math.E');
    // eslint-disable-next-line no-new-func
    return new Function('x', `"use strict"; return (${safe})`)(x);
  }

  renderTemplate(): void {
    // Template rendering (JSXGraph) — placeholder for future integration
    this.emit();
  }

  async initCanvas(): Promise<void> {
    if (!this.canvasRef) return;
    const Konva = await import('konva');
    const container = this.canvasRef.nativeElement as HTMLDivElement;
    container.innerHTML = '';

    const stage = new Konva.default.Stage({
      container: container as any,
      width: container.offsetWidth || 600,
      height: 280,
    });
    const layer = new Konva.default.Layer();
    stage.add(layer);

    // Grid
    for (let x = 0; x < 600; x += 30) {
      layer.add(new Konva.default.Line({
        points: [x, 0, x, 280], stroke: '#f3f4f6', strokeWidth: 1,
      }));
    }
    for (let y = 0; y < 280; y += 30) {
      layer.add(new Konva.default.Line({
        points: [0, y, 600, y], stroke: '#f3f4f6', strokeWidth: 1,
      }));
    }

    // Axes
    layer.add(new Konva.default.Line({ points: [300, 0, 300, 280], stroke: '#9ca3af', strokeWidth: 1 }));
    layer.add(new Konva.default.Line({ points: [0, 140, 600, 140], stroke: '#9ca3af', strokeWidth: 1 }));

    // Free drawing
    let isDrawing = false;
    let lastLine: any = null;
    stage.on('mousedown touchstart', () => {
      isDrawing = true;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      lastLine = new Konva.default.Line({
        stroke: '#2563eb', strokeWidth: 2, lineCap: 'round', lineJoin: 'round',
        points: [pos.x, pos.y],
      });
      layer.add(lastLine);
    });
    stage.on('mousemove touchmove', () => {
      if (!isDrawing || !lastLine) return;
      const pos = stage.getPointerPosition();
      if (!pos) return;
      lastLine.points([...lastLine.points(), pos.x, pos.y]);
      layer.batchDraw();
    });
    stage.on('mouseup touchend', () => {
      isDrawing = false;
      this.emit();
    });

    layer.draw();
    this.stageDestroy = () => stage.destroy();
    this.emit();
  }

  private destroyCanvas(): void {
    if (this.stageDestroy) {
      this.stageDestroy();
      this.stageDestroy = null;
    }
    if (this.plotly && this.plotRef) {
      try { this.plotly.purge(this.plotRef.nativeElement); } catch {}
    }
    this.plotRendered = false;
  }

  private emit(): void {
    this.configChange.emit({
      level: this.level,
      expression: this.expression,
      templateType: this.templateType,
      templateParams: this.templateParams,
    });
  }

  ngOnDestroy(): void {
    this.destroyCanvas();
  }
}
