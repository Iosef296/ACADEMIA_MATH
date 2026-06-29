import { NgModule } from '@angular/core';
import { RouterModule, Routes, NoPreloading } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { rolesGuard } from './core/guards/roles.guard';
import { examGuard } from './core/guards/exam.guard';
import { ShellComponent } from './layout/shell/shell.component';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.module').then((m) => m.DashboardModule),
      },
      {
        path: 'topics',
        loadChildren: () => import('./features/topics/topics.module').then((m) => m.TopicsModule),
      },
      {
        path: 'exercises',
        loadChildren: () => import('./features/exercises/exercises.module').then((m) => m.ExercisesModule),
      },
      {
        path: 'editor',
        canActivate: [rolesGuard],
        data: { roles: ['teacher', 'admin'] },
        loadChildren: () => import('./features/editor/editor.module').then((m) => m.EditorModule),
      },
      {
        path: 'pdf',
        loadChildren: () => import('./features/pdf/pdf.module').then((m) => m.PdfModule),
      },
      {
        path: 'exams',
        loadChildren: () => import('./features/exam/exam.module').then((m) => m.ExamModule),
      },
      {
        path: 'forum',
        loadChildren: () => import('./features/forum/forum.module').then((m) => m.ForumModule),
      },
      {
        path: 'live',
        loadChildren: () => import('./features/live/live.module').then((m) => m.LiveModule),
      },
      {
        path: 'progress',
        loadChildren: () => import('./features/progress/progress.module').then((m) => m.ProgressModule),
      },
      {
        path: 'gamification',
        loadChildren: () => import('./features/gamification/gamification.module').then((m) => m.GamificationModule),
      },
      {
        path: 'ocr',
        loadChildren: () => import('./features/ocr/ocr.module').then((m) => m.OcrModule),
      },
      {
        path: 'question-bank',
        canActivate: [rolesGuard],
        data: { roles: ['teacher', 'admin'] },
        loadChildren: () => import('./features/question-bank/question-bank.module').then((m) => m.QuestionBankModule),
      },
      {
        path: 'admin',
        canActivate: [rolesGuard],
        data: { roles: ['admin'] },
        loadChildren: () => import('./features/admin/admin.module').then((m) => m.AdminModule),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top', preloadingStrategy: NoPreloading })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
