import { Router } from 'express';
import db from './db.js';
import { z } from 'zod';
import { AuthenticatedRequest } from './middleware.js';

const router = Router();

const CreateSchema = z.object({
	title: z.string().min(2).max(80),
	description: z.string().max(500).optional(),
	location: z.string().max(120).optional(),
	startAt: z.string().optional(),
	maxGuests: z.number().int().positive().optional()
});

router.post('/', (req: AuthenticatedRequest, res) => {
	const parsed = CreateSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
	const hostUserId = req.user!.id;
	const { title, description, location, startAt, maxGuests } = parsed.data;

	const info = db.prepare(`
		INSERT INTO chill_plans (hostUserId, title, description, location, startAt, maxGuests)
		VALUES (?, ?, ?, ?, ?, ?)
	`).run(hostUserId, title, description ?? null, location ?? null, startAt ?? null, maxGuests ?? null);

	res.json({ id: info.lastInsertRowid });
});

router.get('/browse', (_req, res) => {
	const plans = db.prepare(`
		SELECT cp.*, u.fullName AS hostName
		FROM chill_plans cp JOIN users u ON u.id = cp.hostUserId
		ORDER BY cp.createdAt DESC
		LIMIT 100
	`).all();
	res.json(plans);
});

export default router;


