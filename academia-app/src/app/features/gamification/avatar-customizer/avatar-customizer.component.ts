import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

interface AvatarConfig {
  skin: string;
  hair: string;
  hairColor: string;
  eyes: string;
  accessory: string;
  bg: string;
}

const OPTIONS = {
  skin:      ['#FDBCB4', '#F1A97A', '#D4845A', '#A0522D', '#5C3317'],
  hairColor: ['#2C1B18', '#A0522D', '#D4A017', '#C0392B', '#8E44AD', '#95A5A6'],
  hair:      ['none', 'short', 'long', 'curly', 'bun'],
  eyes:      ['normal', 'happy', 'cool', 'sleepy'],
  accessory: ['none', 'glasses', 'headband', 'cap'],
  bg:        ['#EFF6FF', '#F0FDF4', '#FEF9C3', '#FDF2F8', '#F0F9FF', '#ECFEFF'],
};

@Component({
  selector: 'app-avatar-customizer',
  templateUrl: './avatar-customizer.component.html',
  standalone: false,
})
export class AvatarCustomizerComponent implements OnInit {
  options = OPTIONS;

  config: AvatarConfig = {
    skin: OPTIONS.skin[0],
    hair: OPTIONS.hair[1],
    hairColor: OPTIONS.hairColor[0],
    eyes: OPTIONS.eyes[0],
    accessory: OPTIONS.accessory[0],
    bg: OPTIONS.bg[0],
  };

  saving = false;
  saved = false;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.get<{ avatar_config: AvatarConfig }>('users/me').subscribe({
      next: (user) => {
        if (user.avatar_config) {
          this.config = { ...this.config, ...user.avatar_config };
        }
      },
    });
  }

  set(key: keyof AvatarConfig, value: string): void {
    this.config = { ...this.config, [key]: value };
    this.saved = false;
  }

  save(): void {
    this.saving = true;
    this.api.put('users/me/avatar', { avatar_config: this.config }).subscribe({
      next: () => {
        this.saving = false;
        this.saved = true;
        setTimeout(() => (this.saved = false), 2500);
      },
      error: () => { this.saving = false; },
    });
  }

  // Minimal SVG avatar preview
  get avatarSvg(): string {
    const { skin, bg, hairColor, hair, eyes, accessory } = this.config;

    const eyeShape =
      eyes === 'happy'  ? '<circle cx="38" cy="52" r="4" fill="#333"/><circle cx="62" cy="52" r="4" fill="#333"/><path d="M36 58 Q50 66 64 58" stroke="#333" stroke-width="2" fill="none"/>' :
      eyes === 'cool'   ? '<line x1="34" y1="50" x2="42" y2="54" stroke="#333" stroke-width="3" stroke-linecap="round"/><line x1="58" y1="50" x2="66" y2="54" stroke="#333" stroke-width="3" stroke-linecap="round"/>' :
      eyes === 'sleepy' ? '<path d="M34 52 Q38 56 42 52" stroke="#333" stroke-width="2" fill="none"/><path d="M58 52 Q62 56 66 52" stroke="#333" stroke-width="2" fill="none"/>' :
                          '<circle cx="38" cy="52" r="4" fill="#333"/><circle cx="62" cy="52" r="4" fill="#333"/>';

    const hairShape =
      hair === 'short'  ? `<ellipse cx="50" cy="34" rx="22" ry="10" fill="${hairColor}"/>` :
      hair === 'long'   ? `<ellipse cx="50" cy="34" rx="22" ry="10" fill="${hairColor}"/><rect x="28" y="38" width="8" height="32" rx="4" fill="${hairColor}"/><rect x="64" y="38" width="8" height="32" rx="4" fill="${hairColor}"/>` :
      hair === 'curly'  ? `<ellipse cx="50" cy="32" rx="24" ry="12" fill="${hairColor}"/><circle cx="30" cy="44" r="8" fill="${hairColor}"/><circle cx="70" cy="44" r="8" fill="${hairColor}"/>` :
      hair === 'bun'    ? `<ellipse cx="50" cy="34" rx="22" ry="10" fill="${hairColor}"/><circle cx="50" cy="22" r="10" fill="${hairColor}"/>` : '';

    const accessoryShape =
      accessory === 'glasses'  ? '<rect x="30" y="49" width="14" height="10" rx="5" stroke="#555" stroke-width="2" fill="none"/><rect x="56" y="49" width="14" height="10" rx="5" stroke="#555" stroke-width="2" fill="none"/><line x1="44" y1="54" x2="56" y2="54" stroke="#555" stroke-width="2"/>' :
      accessory === 'headband' ? `<rect x="28" y="37" width="44" height="7" rx="3" fill="${hairColor}" opacity="0.8"/>` :
      accessory === 'cap'      ? `<path d="M26 40 Q50 20 74 40 Z" fill="${hairColor}"/><rect x="22" y="39" width="56" height="6" rx="3" fill="${hairColor}"/>` : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <rect width="100" height="100" rx="50" fill="${bg}"/>
      ${hairShape}
      <ellipse cx="50" cy="52" rx="22" ry="26" fill="${skin}"/>
      ${eyeShape}
      <path d="M42 66 Q50 72 58 66" stroke="#c0737a" stroke-width="2" fill="none" stroke-linecap="round"/>
      ${accessoryShape}
    </svg>`;
  }
}
