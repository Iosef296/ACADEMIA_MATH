import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectUserRole } from '../../store/auth/auth.selectors';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  standalone: false,
})
export class SidebarComponent implements OnInit {
  userRole$!: Observable<string | undefined>;

  navItems: NavItem[] = [
    { label: 'Inicio', route: '/dashboard', icon: 'home' },
    { label: 'Temas', route: '/topics', icon: 'topics' },
    { label: 'Ejercicios', route: '/exercises', icon: 'exercises' },
    { label: 'Flashcards', route: '/exercises/flashcards', icon: 'flashcards' },
    { label: 'Exámenes', route: '/exams', icon: 'exams' },
    { label: 'Historial Exámenes', route: '/exams/history', icon: 'history' },
    { label: 'Foro', route: '/forum', icon: 'forum' },
    { label: 'En vivo', route: '/live', icon: 'live' },
    { label: 'Progreso', route: '/progress', icon: 'progress' },
    { label: 'Mis Reportes', route: '/progress/reports', icon: 'reports' },
    { label: 'Metas de Estudio', route: '/progress/goals', icon: 'goals' },
    { label: 'Gamificación', route: '/gamification', icon: 'gamification' },
    { label: 'OCR', route: '/ocr', icon: 'ocr' },
    { label: 'Banco Preguntas', route: '/question-bank', icon: 'qbank', roles: ['teacher', 'admin'] },
    { label: 'Editor', route: '/editor', icon: 'editor', roles: ['teacher', 'admin'] },
    { label: 'PDF', route: '/pdf', icon: 'pdf', roles: ['teacher', 'admin'] },
    { label: 'Administrar', route: '/admin', icon: 'admin', roles: ['admin'] },
    { label: 'Misiones', route: '/admin/missions', icon: 'missions', roles: ['admin'] },
    { label: 'Recompensas Nivel', route: '/admin/level-rewards', icon: 'rewards', roles: ['admin'] },
  ];

  constructor(private store: Store) {}

  ngOnInit(): void {
    this.userRole$ = this.store.select(selectUserRole);
  }

  isVisible(item: NavItem, role: string | undefined | null): boolean {
    if (!item.roles) return true;
    return !!role && item.roles.includes(role);
  }
}
