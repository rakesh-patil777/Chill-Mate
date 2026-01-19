import { Router } from 'express';
import db from './db.js';
import { z } from 'zod';
const router = Router();
const CreateSchema = z.object({
    toUserId: z.number().int().positive(),
    context: z.enum(['chill', 'study', 'friend']),
    referenceId: z.number().int().positive().optional()
});
router.post('/', (req, res) => {
    const parsed = CreateSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const fromUserId = req.user.id;
    const { toUserId, context, referenceId } = parsed.data;
    const info = db.prepare(`
		INSERT INTO invitations (fromUserId, toUserId, context, referenceId)
		VALUES (?, ?, ?, ?)
	`).run(fromUserId, toUserId, context, referenceId ?? null);
    res.json({ id: info.lastInsertRowid });
});
router.get('/incoming', (req, res) => {
    const userId = req.user.id;
    const rows = db.prepare(`
		SELECT i.*, u.fullName AS fromName
		FROM invitations i JOIN users u ON u.id = i.fromUserId
		WHERE i.toUserId = ?
		ORDER BY i.createdAt DESC
	`).all(userId);
    res.json(rows);
});
router.post('/:id/respond', (req, res) => {
    const id = Number(req.params.id);
    const status = String(req.body.status);
    if (!['accepted', 'declined'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }
    db.prepare(`UPDATE invitations SET status = ? WHERE id = ?`).run(status, id);
    res.json({ ok: true });
});
export default router;
