import {
  ChangeDetectorRef,
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface LiveSession {
  id: number;
  title: string;
  topic: { id: number; name: string } | null;
  host: { id: number; name: string };
  jitsi_room: string;
  started_at: string;
  ended_at: string | null;
}

declare const JitsiMeetExternalAPI: any;

@Component({
  selector: 'app-live-room',
  templateUrl: './live-room.component.html',
  standalone: false,
})
export class LiveRoomComponent implements OnInit, OnDestroy {
  @ViewChild('jitsiContainer', { static: false }) jitsiContainer!: ElementRef;

  sessionId!: number;
  session: LiveSession | null = null;
  loading = false;
  error = '';

  private jitsiApi: any = null;
  jitsiReady = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.sessionId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSession();
  }

  ngOnDestroy(): void {
    this.disposeJitsi();
  }

  private loadSession(): void {
    this.api.get<LiveSession>(`live/sessions/${this.sessionId}`).subscribe({
      next: (session) => {
        this.session = session;
        this.loading = false;
        this.cdr.detectChanges();
        if (session.ended_at) {
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
      roomName: this.session!.jitsi_room,
      parentNode: this.jitsiContainer.nativeElement,
      width: '100%',
      height: '100%',
      configOverwrite: {
        startWithAudioMuted: true,
        startWithVideoMuted: false,
        disableDeepLinking: true,
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

  leave(): void {
    this.disposeJitsi();
    this.router.navigate(['/live']);
  }
}
