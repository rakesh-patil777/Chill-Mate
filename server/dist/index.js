import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes.auth.js';
import profilesRoutes from './routes.profiles.js';
import chillRoutes from './routes.chill.js';
import studyRoutes from './routes.study.js';
import invitationsRoutes from './routes.invitations.js';
import friendsRoutes from './routes.friends.js';
import { requireAuth } from './middleware.js';
const app = express();
app.use(cors());
app.use(express.json());
app.get('/health', (_req, res) => res.json({ ok: true, name: 'Chill Mate' }));
app.use('/auth', authRoutes);
const auth = requireAuth(process.env.JWT_SECRET || 'dev-secret');
app.use('/profiles', auth, profilesRoutes);
app.use('/chill', auth, chillRoutes);
app.use('/study', auth, studyRoutes);
app.use('/invitations', auth, invitationsRoutes);
app.use('/friends', auth, friendsRoutes);
// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, '../public')));
// For any other request, send the website's index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});
const port = process.env.PORT || 4000;
app.listen(port, () => {
    console.log(`Chill Mate API listening on port ${port}`);
});
