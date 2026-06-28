import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { User } from '../../store/auth/auth.state';
import { selectCurrentUser } from '../../store/auth/auth.selectors';
import { logout } from '../../store/auth/auth.actions';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  standalone: false,
})
export class NavbarComponent implements OnInit {
  user$!: Observable<User | null>;
  showUserMenu = false;

  searchQuery = '';
  searchResults: any = null;
  searching = false;

  private searchSubject = new Subject<string>();

  constructor(private store: Store, private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.user$ = this.store.select(selectCurrentUser);

    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(q => {
        if (q.length < 2) { this.searchResults = null; return []; }
        this.searching = true;
        return this.api.get<any>('search', { q });
      })
    ).subscribe({
      next: (res) => { this.searchResults = res; this.searching = false; },
      error: () => { this.searching = false; },
    });
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  search(): void {
    if (this.searchQuery.length >= 2) {
      this.router.navigate(['/exercises'], { queryParams: { q: this.searchQuery } });
      this.clearSearch();
    }
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = null;
  }

  doLogout(): void {
    this.showUserMenu = false;
    this.store.dispatch(logout());
  }
}
