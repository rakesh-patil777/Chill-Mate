import { Router } from 'express';
import db from './db.js';
import { z } from 'zod';
const router = Router();
const CreateSchema = z.object({
    title: z.string().min(2).max(80),
    topic: z.string().max(120).optional(),
    location: z.string().max(120).optional(),
    startAt: z.string().optional(),
    maxParticipants: z.number().int().positive().optional()
});
router.post('/', (req, res) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const hostUserId = req.user.id;
    const { title, topic, location, startAt, maxParticipants } = parsed.data;
    const info = db.prepare(`
		INSERT INTO study_events (hostUserId, title, topic, location, startAt, maxParticipants)
		VALUES (?, ?, ?, ?, ?, ?)
	`).run(hostUserId, title, topic ?? null, location ?? null, startAt ?? null, maxParticipants ?? null);
    res.json({ id: info.lastInsertRowid });
});
router.get('/browse', (_req, res) => {
    const events = db.prepare(`
		SELECT se.*, u.fullName AS hostName
		FROM study_events se JOIN users u ON u.id = se.hostUserId
		ORDER BY se.createdAt DESC
		LIMIT 100
	`).all();
    res.json(events);
});
export default router;
