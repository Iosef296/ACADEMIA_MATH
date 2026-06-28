# ACADEMIA — Backend (NestJS API)

## Stack
- NestJS 11, TypeORM, PostgreSQL 16, Valkey (Redis-compat), Passport-JWT, bcryptjs
- Socket.io (WebSockets para notificaciones)
- Puppeteer (PDF), Tesseract.js (OCR)

## Cómo iniciar

### 1. Crear `.env` en `backend/`
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=academia_db

JWT_SECRET=minimo32caracteres_secreto_aqui
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=diferente_al_anterior_minimo32
JWT_REFRESH_EXPIRES_IN=7d

VALKEY_HOST=localhost
VALKEY_PORT=6379

NODE_ENV=development
```

### 2. Docker
```powershell
docker compose up -d
```
- PostgreSQL 16 → puerto 5432 (container: `academia_postgres`)
- Valkey 7 → puerto 6379 (container: `academia_valkey`)

> ⚠️ Si 5432 está ocupado → cambiar a `5435:5432` en docker-compose.yml y `DB_PORT=5435` en .env

### 3. Arrancar
```powershell
cd backend
npm install
npm run start:dev
```
- Corre en http://localhost:3000
- Prefix global: `/api`
- Watch mode

---

## Arquitectura

### Config (`src/config/`)
| Archivo | Namespace | Env vars leídas |
|---|---|---|
| `database.config.ts` | `database` | `DB_HOST/PORT/USERNAME/PASSWORD/NAME` o `DATABASE_URL` |
| `jwt.config.ts` | `jwt` | `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` |
| `valkey.config.ts` | `valkey` | `VALKEY_HOST`, `VALKEY_PORT` |

ConfigService → `config.get('jwt.secret')`, `config.get('database')`, etc.

### Auth
- Login por **email** + password (no username)
- Endpoint: `POST /api/auth/login` → `{ access_token, refresh_token, user }`
- `access_token`: JWT corto (15m). `refresh_token`: JWT largo (7d)
- `POST /api/auth/register` → `{ access_token, refresh_token, user }`
- `POST /api/auth/refresh` → `{ access_token, refresh_token }` (body: `{ refresh_token }`)
- `JwtStrategy.validate()` busca user en DB por `payload.sub` (UUID) → retorna User completo
- Guards: `JwtAuthGuard` (passport-jwt), `RolesGuard` (verifica `req.user.role`)

### User Entity (`modules/users/entities/user.entity.ts`)
```
id: uuid (PK)
name: string
email: string (unique)
password_hash: string
role: enum('student','teacher','admin')  ← default: student
created_at: Date
profile: OneToOne → StudentProfile
```

### StudentProfile Entity
```
id: uuid
user: OneToOne → User
xp_total: number (default 0) ← NO se actualiza automáticamente (bug conocido)
streak_current: number
streak_max: number
streak_last_active: Date (type: 'date')
ranking_visible: boolean (default true)
avatar_config: jsonb
```

---

## Módulos (15 total)

| Módulo | Controller base | Descripción |
|---|---|---|
| `auth` | `/api/auth` | login, register, refresh |
| `users` | `/api/users` | CRUD, me, avatar, roles |
| `topics` | `/api/topics` | árbol de temas (parent/children), UUID PK |
| `exercises` | `/api/exercises` | ejercicios LaTeX, pasos, variables paramétricas |
| `graphs` | `/api/graphs` | gráficas JSXGraph |
| `exams` | `/api/exams` | exámenes adaptativos, intentos, respuestas |
| `forum` | `/api/forum` | foro con respuestas y adjuntos |
| `live` | `/api/live` | sesiones en vivo (Jitsi) |
| `progress` | `/api/progress` | progreso por tema, streak, errores |
| `gamification` | `/api/gamification` | badges, challenges semanales, rewards, ranking |
| `mood` | `/api/mood` | estado de ánimo del estudiante |
| `routines` | `/api/routines` | rutinas de estudio con micro-lecciones |
| `ocr` | `/api/ocr` | OCR de imágenes (Tesseract) |
| `pdf` | `/api/pdf` | generación PDF (Puppeteer) |
| `notifications` | WebSocket `/notifications` | notificaciones en tiempo real (Socket.io) |

---

## Endpoints clave

### Users
```
GET    /api/users/me          → user sin password_hash (autenticado)
PUT    /api/users/me          → actualizar nombre
PUT    /api/users/me/avatar   → actualizar avatar_config
GET    /api/users             → todos (admin)
PUT    /api/users/:id/role    → cambiar rol (admin)
DELETE /api/users/:id         → eliminar (admin)
```

### Topics (todos los IDs son UUID string)
```
GET  /api/topics      → árbol (solo roots con children)
GET  /api/topics/:id  → topic con parent y children
POST /api/topics      → crear (teacher/admin)
PUT  /api/topics/:id  → actualizar (teacher/admin)
DELETE /api/topics/:id → eliminar (admin)
```

### Exercises
```
GET  /api/exercises                → lista (query: topicId, difficulty)
GET  /api/exercises/:id            → detalle con steps y variables
GET  /api/exercises/:id/generate   → genera variación paramétrica → { exercise, values, content_latex }
POST /api/exercises/rate           → registra rating post-ejercicio → { triggerMicroLesson: boolean }
POST /api/exercises                → crear (teacher/admin)
PUT  /api/exercises/:id            → editar (teacher/admin o owner)
DELETE /api/exercises/:id          → eliminar (teacher/admin o owner)
GET  /api/exercises/:id/steps      → pasos ordenados
POST /api/exercises/:id/steps      → agregar paso (teacher/admin)
PUT  /api/exercises/:id/steps/reorder  → reordenar (teacher/admin) ← va ANTES de :stepId
PUT  /api/exercises/:id/steps/:stepId  → editar paso
DELETE /api/exercises/:id/steps/:stepId → eliminar paso
```

### Progress
```
GET /api/progress              → todos los progresos del usuario autenticado
GET /api/progress/errors       → temas con errores, ordenados por error_count DESC
GET /api/progress/streak       → { current, max, last_active }
GET /api/progress/topics/:topicId → progreso en un tema específico
```
> `recordExercise(userId, topicId, {isCorrect, timeSpent})` se llama internamente desde `POST /exercises/rate`

### Gamification
```
GET  /api/gamification/badges       → todos los badges
GET  /api/gamification/badges/mine  → mis badges
GET  /api/gamification/challenges   → desafíos activos
POST /api/gamification/challenges   → crear (teacher/admin)
POST /api/gamification/challenges/:id/submit → enviar intento
GET  /api/gamification/rewards/mine → mis recompensas
POST /api/gamification/rewards/:id/use → usar recompensa
GET  /api/gamification/ranking      → ranking semanal (top 50)
PUT  /api/gamification/ranking/visibility → mostrar/ocultar en ranking
```

### WebSocket Notifications
```
Namespace: /notifications
Auth: token en handshake.auth.token (JWT)
Eventos server→client:
  'unread'        → notificaciones no leídas al conectar
  'notification'  → nueva notificación en tiempo real
Eventos client→server:
  'read'          → marcar notificación como leída (body: notificationId)
```

---

## Bugs corregidos

### 1. `progress.service.ts` — `getErrors()` campo inexistente
**Antes:** `map(p => ({ topic: p.topic, ... }))` — `p.topic` no existe, `getAll()` retorna `p.topic_name`
**Fix:** Retorna el objeto completo de `getAll()` sin remapear

### 2. `exercises.controller.ts` — Route conflict en steps
**Antes:** `PUT :id/steps/:stepId` definido ANTES que `PUT :id/steps/reorder` → reorder nunca alcanzaba su handler (Express matchea primero `:stepId='reorder'`)
**Fix:** Movido `reorder` ANTES de `:stepId`

### 3. `exercises.controller.ts` — Missing `POST rate` endpoint
**Antes:** Frontend llamaba `POST exercises/rate` → 404
**Fix:** Agregado endpoint que llama `ProgressService.recordExercise()` y retorna `{ triggerMicroLesson }`
**Requirió:** Importar `ProgressModule` en `ExercisesModule`

### 4. `notifications.module.ts` — JwtModule sin secret
**Antes:** `JwtModule.register({})` → WebSocket `jwtService.verify()` siempre fallaba (no secret)
**Fix:** `JwtModule.registerAsync` con `ConfigService` → lee `jwt.secret` del config

### 5. `users.controller.ts` — `getMe()` filtraba `password_hash`
**Antes:** Retornaba User entity completa incluyendo `password_hash`
**Fix:** Destructura y omite `password_hash` antes de retornar

---

## Convenciones
- Todos los PKs son **UUID** (no números)
- `synchronize: true` en dev (auto-migra). En producción usar migrations
- `logging: true` en dev (queries en consola)
- Guards anidados: `@UseGuards(JwtAuthGuard)` en clase + `@UseGuards(RolesGuard) @Roles(...)` en método específico
- `req.user` es la entidad `User` completa (cargada por JwtStrategy desde DB)
