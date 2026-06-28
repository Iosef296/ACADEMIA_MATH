# ACADEMIA — Frontend (Angular App)

## Stack
- Angular 21 (NgModule, no standalone), NgRx 21, PrimeNG 21, Tailwind CSS
- KaTeX, MathLive, JSXGraph, Konva, Plotly.js, socket.io-client

## Cómo iniciar
```powershell
cd frontend
npm install
npm start
```
- Corre en http://localhost:4200
- API: `http://localhost:3000/api` (ver `src/environments/environment.ts`)

---

## Arquitectura

### Patrón: NgModule (NO standalone components)
- Todos los componentes tienen `standalone: false`
- Módulos con `declarations` + `imports` + lazy loading por ruta
- Estado global con **NgRx** (no signals como en Colegio)

### Configuración de entorno (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  wsUrl: 'ws://localhost:3000',
  jitsiUrl: 'https://meet.jit.si',
};
```

---

## Estado (NgRx Store)

### Auth State (`store/auth/`)
```typescript
interface AuthState {
  user: User | null;
  access_token: string | null;
  refresh_token: string | null;
  loading: boolean;
  error: string | null;
  initialized: boolean;  // true tras intentar restaurar sesión
}
```

**Flujo de inicio:**
1. `App.ngOnInit()` dispatch `loadUserFromStorage()`
2. Effect lee `access_token` de localStorage → `GET users/me`
3. Si OK → dispatch `setUser(...)` → `initialized = true`
4. Si falla o no hay token → dispatch `logout()` → `initialized = true`
5. `authGuard` espera `initialized = true` antes de verificar autenticación

**Acciones:**
- `login`, `loginSuccess`, `loginFailure`
- `register`, `registerSuccess`, `registerFailure`
- `logout` → limpia storage, navega a `/auth/login`
- `loadUserFromStorage` → restaura sesión al iniciar app
- `setUser` → setea user+tokens en store

**Selectores:**
- `selectCurrentUser` → `User | null`
- `selectIsAuthenticated` → `!!access_token`
- `selectAuthLoading` → boolean
- `selectAuthError` → `string | null`
- `selectUserRole` → `'student'|'teacher'|'admin'|undefined`
- `selectInitialized` → boolean

### Exam State (`store/exam/`)
```typescript
interface ExamState {
  attemptId: string | null;
  active: boolean;
}
```
Acciones: `startExam({ attemptId })`, `endExam()`

---

## Servicios core (`src/app/core/`)

### `ApiService`
```typescript
get<T>(path: string, params?: Record<string, string>): Observable<T>
post<T>(path: string, body: any): Observable<T>
put<T>(path: string, body: any): Observable<T>
delete<T>(path: string): Observable<T>
upload<T>(path: string, file: File, fieldName?): Observable<T>
```
URL base: `environment.apiUrl`. Path relativo sin leading slash.
Ejemplo: `this.api.get('topics')` → `GET http://localhost:3000/api/topics`

### `StorageService`
```typescript
set(key, value): void     // JSON.stringify
get<T>(key): T | null     // JSON.parse
remove(key): void
clear(): void
```
Claves usadas: `'access_token'`, `'refresh_token'`

### `auth.interceptor.ts`
- Lee `access_token` de localStorage
- Si hay token → agrega `Authorization: Bearer <token>`
- Si respuesta es **401** y había token → dispatch `logout()` (limpia storage + redirige a login)

---

## Guards

### `authGuard`
- Espera `initialized = true` (filter + take(1))
- Luego verifica `isAuthenticated`
- Si no autenticado → redirige a `/auth/login`

### `rolesGuard`
- Lee `route.data['roles']` (array de strings)
- Verifica `user.role` contra la lista
- Si no autorizado → redirige a `/dashboard`

### `examGuard` (CanDeactivate)
- Verifica `selectExamActive` del store
- Si examen activo → confirm() antes de salir

---

## Módulos y rutas

### Rutas principales (`app-routing-module.ts`)
```
/auth          → AuthModule (público)
/             → ShellComponent (requiere authGuard)
  /dashboard   → DashboardModule
  /topics      → TopicsModule
  /exercises   → ExercisesModule
  /editor      → EditorModule (requiere rolesGuard: teacher/admin)
  /pdf         → PdfModule
  /exams       → ExamModule
  /forum       → ForumModule
  /live        → LiveModule
  /progress    → ProgressModule
  /gamification→ GamificationModule
  /ocr         → OcrModule
  /admin       → AdminModule (requiere rolesGuard: admin)
```

### Layout (`app/layout/`)
- `ShellComponent`: contenedor principal con navbar + sidebar + router-outlet
- `NavbarComponent`: logo, bell de notificaciones, user menu (logout)
- `SidebarComponent`: menú con iconos SVG, filtra items por rol

### Auth (`features/auth/`)
- `LoginComponent`: form email+password, dispatch `login()`
- `RegisterComponent`: form nombre+email+password+confirm, dispatch `register({ role: 'student' })`

### Dashboard (`features/dashboard/`)
- `StudentDashboardComponent`: streak, XP total, progreso por tema, mood del día, desafío activo
- Carga: `GET progress/streak`, `GET progress`, `GET gamification/challenges`
- Fecha muestra en **español** (locale 'es' registrado)

### Topics (`features/topics/`)
- `TopicListComponent`: lista con búsqueda, muestra subtemas. IDs son **UUID string**.
- `TopicDetailComponent`: detalle + progreso + ejercicios del tema. ID leído como string del route.

### Exercises (`features/exercises/`)
- `ExerciseListComponent`: lista con filtro por dificultad y topicId (query param UUID string)
- `ExerciseDetailComponent`:
  - Carga ejercicio + steps por ID (UUID string, no número)
  - Si paramétrico: `GET exercises/:id/generate` → `{ values, content_latex }` (no `statement`)
  - Pasos se revelan secuencialmente
  - Al terminar: rating de dificultad → `POST exercises/rate` → `{ triggerMicroLesson }`
  - Si `triggerMicroLesson = true` → muestra micro-lección

### Editor (`features/editor/`) — teacher/admin
- `ExerciseEditorComponent`: crear/editar ejercicios con LaTeX
- `GraphEditorComponent`: editor de gráficas JSXGraph
- `MathEditorComponent`: editor con MathLive
- `StepEditorComponent`: gestión de pasos de un ejercicio

### Exam (`features/exam/`)
- `ExamListComponent`: lista de exámenes disponibles
- `ExamSessionComponent`: sesión de examen (respuestas LaTeX, anti-cheat con `leftScreen`)
- `ExamResultsComponent`: resultados con score

### Forum (`features/forum/`)
- `ForumListComponent`: lista de posts (filtro por tema/ejercicio)
- `ForumPostComponent`: post con respuestas y adjuntos

### Progress (`features/progress/`)
- `ProgressOverviewComponent`: progreso por tema
- `BadgesComponent`: insignias obtenidas
- `RankingComponent`: ranking semanal

### Gamification (`features/gamification/`)
- `ChallengesComponent`: desafíos semanales
- `RewardsComponent`: recompensas disponibles/usadas
- `AvatarCustomizerComponent`: personalización de avatar (JSONb)

### Shared (`features/shared/`)
- `LatexRendererComponent`: renderiza LaTeX con KaTeX

---

## Bugs corregidos

### 1. `auth.interceptor.ts` — Sin handler 401
**Antes:** Token expira en 15min → todas las requests retornan 401 pero la app no hace nada → usuario queda atrapado
**Fix:** `catchError` en interceptor → si 401 y había token → `store.dispatch(logout())` → limpia storage y redirige a login

### 2. `exercise-detail.component.ts` — IDs como número (UUIDs)
**Antes:** `exerciseId: number` + `Number(uuid)` = NaN → todas las APIs de ejercicio fallaban silenciosamente
**Fix:** `exerciseId: string` = `route.snapshot.paramMap.get('id') ?? ''`

### 3. `exercise-detail.component.ts` — Campos erróneos del backend
**Antes:**
- `exercise?.statement_latex` → `undefined` (el campo es `content_latex`)
- `res.statement` tras llamar `generate` → `undefined` (backend retorna `content_latex`)
**Fix:** Usar `content_latex` en ambos casos. Interface `Exercise` también corregida.

### 4. `topic-detail.component.ts` — topicId como número
**Antes:** `topicId: number` + `Number(uuid)` = NaN → topic/exercises/progress no cargaban
**Fix:** `topicId: string` = `route.snapshot.paramMap.get('id') ?? ''`

### 5. `exercise-list.component.ts` — topicId como número + loading
**Antes:** `topicId: number` → `Number(uuid) = NaN` → falsy → filtro por tema nunca aplicaba. `loading` nunca se activaba.
**Fix:** `topicId: string | null`, usa `ApiService.get('exercises', { topicId })`, `loading = true` antes del fetch

### 6. `topic-list.component.ts` — loading nunca activado
**Antes:** `loading = false` inicial, nunca se seteaba a `true` → spinner nunca aparecía
**Fix:** `loading = true` antes del `api.get()`

### 7. `app-module.ts` — Locale español no registrado
**Antes:** Date pipe con `'es'` en dashboard mostraba fechas en inglés
**Fix:** `registerLocaleData(localeEs)` + `{ provide: LOCALE_ID, useValue: 'es' }`

---

## Convenciones
- Todos los IDs de entidades son **UUID string** (no number). Las interfaces locales deben usar `id: string`.
- Rutas lazy-loaded con `loadChildren`
- Componentes no standalone: siempre declarados en un NgModule
- NgRx effects hacen las llamadas HTTP (no directamente en componentes para auth)
- Para endpoints no-auth, los componentes usan `ApiService` directamente
- El interceptor agrega el token automáticamente — no pasarlo manualmente en ningún componente

## Flujo de login completo
1. `LoginComponent.submit()` → `store.dispatch(login({ email, password }))`
2. `AuthEffects.login$` → `POST auth/login` → `loginSuccess({ user, access_token, refresh_token })`
3. Effect guarda tokens en localStorage via `StorageService`
4. `loginSuccess$` effect → `router.navigate(['/dashboard'])`
5. Reducer setea `user`, `access_token`, `refresh_token`, `loading: false`, `initialized: true`
