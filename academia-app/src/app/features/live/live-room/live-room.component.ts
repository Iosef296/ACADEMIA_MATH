import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { selectCurrentUser } from '../../../store/auth/auth.selectors';
import { User } from '../../../store/auth/auth.state';
import { LiveSession } from '../live-list/live-list.component';

declare const JitsiMeetExternalAPI: any;

@Component({
  selector: 'app-live-room',
  templateUrl: './live-room.component.html',
  standalone: false,
})
export class LiveRoomComponent implements OnInit, OnDestroy {
  @ViewChild('jitsiContainer', { static: false }) jitsiContainer!: ElementRef;

  sessionId!: string;
  session: LiveSession | null = null;
  loading = true;
  error = '';
  user: User | null = null;

  private jitsiApi: any = null;
  jitsiReady = false;

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private store: Store,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id') ?? '';

    this.store.select(selectCurrentUser)
      .pipe(takeUntil(this.destroy$))
      .subscribe(u => this.user = u);

    this.loadSession();
  }

  ngOnDestroy(): void {
    this.disposeJitsi();
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isOwner(): boolean {
    return !!this.user && !!this.session && this.user.id === this.session.teacherId;
  }

  private loadSession(): void {
    this.loading = true;
    this.api.get<LiveSession>(`live/${this.sessionId}`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (session) => {
          this.session = session;
          this.loading = false;
          this.cdr.detectChanges();
          if (session.status === 'ENDED') {
            this.error = 'Esta sesión ya ha finalizado.';
            return;
          }
          setTimeout(() => this.initJitsi(), 100);
        },
        error: () => {
          this.error = 'No se pudo cargar la sesión.';
          this.loading = false;
          this.cdr.detectChanges();
        },
      });
  }

  private initJitsi(): void {
    if (!this.jitsiContainer?.nativeElement) return;

    if (typeof JitsiMeetExternalAPI === 'undefined') {
      this.loadJitsiScript().then(() => this.mountJitsi());
    } else {
      this.mountJitsi();
    }
  }

  private loadJitsiScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('jitsi-script')) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.id = 'jitsi-script';
      script.src = 'https://meet.jit.si/external_api.js';
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.head.appendChild(script);
    });
  }

  private mountJitsi(): void {
    const domain = 'meet.jit.si';
    const options = {
      roomName: this.session!.jitsiRoomId,
      parentNode: this.jitsiContainer.nativeElement,
      width: '100%',
      height: '100%',
      userInfo: {
        displayName: this.user?.name || 'Participante',
      },
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: false,
        disableDeepLinking: true,
        prejoinPageEnabled: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop',
          'fullscreen', 'fodeviceselection', 'hangup', 'chat',
          'raisehand', 'tileview', 'select-background',
        ],
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
      },
    };

    this.jitsiApi = new JitsiMeetExternalAPI(domain, options);
    this.jitsiReady = true;
    this.cdr.detectChanges();

    this.jitsiApi.addEventListener('readyToClose', () => {
      this.leave();
    });
  }

  private disposeJitsi(): void {
    if (this.jitsiApi) {
      this.jitsiApi.dispose();
      this.jitsiApi = null;
    }
  }

  endSession(): void {
    if (!this.session || !confirm('¿Deseas finalizar esta sesión para todos?')) return;

    this.api.patch<LiveSession>(`live/${this.session.id}/status`, { status: 'ENDED' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.disposeJitsi();
          this.router.navigate(['/live']);
        },
      });
  }

  leave(): void {
    this.disposeJitsi();
    this.router.navigate(['/live']);
  }
}
