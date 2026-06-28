import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { loadUserFromStorage } from './store/auth/auth.actions';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.scss'
})
export class App implements OnInit {
  constructor(private store: Store) {}

  ngOnInit(): void {
    this.store.dispatch(loadUserFromStorage());
  }
}
