# Chill Mate 💖

Tinder-style swipe-based matching app for students. Discover → swipe left/right → mutual like creates a match → view matches and edit profile.

## Tech
- **Backend:** Node.js, Express, TypeScript, SQLite (better-sqlite3), JWT
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Deploy:** Docker optional (see below)

## Quick start (local)

**One-time setup (from project root):**
```bash
npm run setup
```

**Run API + web (browser opens automatically):**
```bash
npm run dev
```
- API: `http://localhost:4000`
- Web: `http://localhost:5173`

Optional: create `server/.env` with `JWT_SECRET=your-secret` (defaults to a dev key if omitted).

## API (Phase 1 MVP)

| Method | Route | Auth | Body / Notes |
|--------|--------|------|----------------|
| POST | `/auth/register` | No | `{ collegeId, password, fullName, age, gender? }` → `{ ok }` |
| POST | `/auth/login` | No | `{ collegeId, password }` → `{ token }` |
| GET | `/profiles/discover` | Yes | Excludes self and already swiped → `User[]` |
| GET | `/profiles/me` | Yes | Current user + profile |
| PUT | `/profiles/me` | Yes | `{ fullName?, age?, bio?, hobbies?, interests?, avatarUrl? }` |
| POST | `/likes` | Yes | `{ targetUserId, liked }` → `{ success, match? }` |
| GET | `/matches` | Yes | List of matches (name, age, avatar, bio) |
| POST | `/matches/check` | Yes | `{ targetUserId }` → `{ matched }` |

## DB schema (SQLite)

- **users** – id, collegeId, password, fullName, age, gender, createdAt
- **profiles** – userId (PK), bio, hobbies, interests, avatarUrl
- **likes** – (fromUserId, toUserId) PK, liked (0/1), createdAt
- **matches** – id, userA, userB, createdAt; UNIQUE(userA, userB)

Indexes on `likes.fromUserId`, `likes.toUserId`, and `matches(userA, userB)`.

## Improvements made (refactor)

- **Backend:** Single `matches` table with id; JWT verified in middleware and `req.user.id` used everywhere; discover excludes current user and already swiped; likes use `fromUserId`/`toUserId` and upsert; mutual like creates match once (userA < userB); auth mounted at `/auth`.
- **Frontend:** Central `api.ts` and `API_BASE`; auth header on all protected calls; SwipeCards use cancel-ref to avoid race; protected routes redirect to login; Profile page loads/saves via GET/PUT `/profiles/me`; Matches page uses `/matches` and shows empty state; Login updates auth context and uses `Link`; Register uses `API_BASE` and `Link`.
- **UX:** Loading and empty states; profile form with avatar URL preview; rounded cards and gradients; nav shows Login/Register when logged out and Discover/Profile/Matches/Logout when logged in.

## Future (Phase 2+)

- Real-time chat (WebSocket), online status, notifications
- Docker production build, env configs, security hardening

## Docker

Create `.env` in project root with `JWT_SECRET` and optionally `ALLOWED_EMAIL_DOMAINS`. Then:

```bash
docker compose up --build
```
- Web: `http://localhost:8080`
- API: `http://localhost:4000`

Set `web/.env` with `VITE_API_BASE=http://localhost:4000` (or your API URL) if the frontend runs outside Docker.
