import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

interface Flashcard {
  exerciseId: string;
  title: string;
  contentLatex: string;
  difficulty: string;
  topic: { id: string; name: string };
  lastRating: string | null;
  lastAttempt: string | null;
}

@Component({
  selector: 'app-flashcards',
  templateUrl: './flashcards.component.html',
  standalone: false,
})
export class FlashcardsComponent implements OnInit {
  cards: Flashcard[] = [];
  loading = false;
  currentIndex = 0;
  flipped = false;

  difficultyColor: Record<string, string> = {
    basic: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loading = true;
    this.api.get<Flashcard[]>('exercises/flashcards').subscribe({
      next: (data) => { this.cards = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  get current(): Flashcard | null {
    return this.cards[this.currentIndex] ?? null;
  }

  flip(): void {
    this.flipped = !this.flipped;
  }

  next(): void {
    if (this.currentIndex < this.cards.length - 1) {
      this.currentIndex++;
      this.flipped = false;
    }
  }

  prev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.flipped = false;
    }
  }

  shuffle(): void {
    this.cards = [...this.cards].sort(() => Math.random() - 0.5);
    this.currentIndex = 0;
    this.flipped = false;
  }
}
