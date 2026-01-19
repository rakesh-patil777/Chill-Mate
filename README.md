# Chill Mate

Full-stack app for college students (18+) to meet, plan chill hangouts, study events (hackathons, tech events), send invitations, and manage profiles with hobbies/interests/habits.

## Tech
- API: Node.js, Express, TypeScript, better-sqlite3, JWT
- Web: React (Vite), TypeScript, Tailwind CSS
- Deploy: Docker, docker-compose

## Local (no Docker)
1. Install Node 18+.
2. Server:
   - `cd server`
   - `npm i`
   - `npm run dev`
3. Web:
   - `cd web`
   - `npm i`
   - `npm run dev`
4. Open `http://localhost:5173`.

## Docker (recommended)
- Create `.env` in project root:
```
JWT_SECRET=replace-with-long-random-secret
ALLOWED_EMAIL_DOMAINS=gmail.com,outlook.com,edu.in,ac.in
```
- Build & run:
```
docker compose up --build
```
- Web: `http://localhost:8080`
- API: `http://localhost:4000`

## API Summary
- POST `/auth/register` { collegeId, password, age, fullName, email?, gender? } → { token }
- POST `/auth/login` { collegeId, password } → { token }
- GET `/profiles/me` (auth)
- PUT `/profiles/me` (auth) { bio?, hobbies?, interests?, habits?, avatarUrl? }
- POST `/chill` (auth) { title, description?, location?, startAt?, maxGuests? }
- GET `/chill/browse` (auth)
- POST `/study` (auth) { title, topic?, location?, startAt?, maxParticipants? }
- GET `/study/browse` (auth)
- POST `/invitations` (auth) { toUserId, context: 'chill'|'study'|'friend', referenceId? }
- GET `/invitations/incoming` (auth)
- POST `/invitations/:id/respond` (auth) { status: 'accepted'|'declined' }
- POST `/friends/:friendUserId` (auth)
- GET `/friends` (auth)

## Notes
- Registration enforces 18+ and validates `collegeId` format. Optionally restricts email domains.
- SQLite file `chillmate.db` stored in API container/workdir.
- Set `web/.env` with `VITE_API_BASE` to point the web app to your API.


