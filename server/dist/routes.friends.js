import { Router } from 'express';
import db from './db.js';
const router = Router();
router.post('/:friendUserId', (req, res) => {
    const userId = req.user.id;
    const friendUserId = Number(req.params.friendUserId);
    if (userId === friendUserId)
        return res.status(400).json({ error: 'Cannot friend yourself' });
    db.prepare(`INSERT OR IGNORE INTO friends (userId, friendUserId) VALUES (?, ?)`).run(userId, friendUserId);
    db.prepare(`INSERT OR IGNORE INTO friends (userId, friendUserId) VALUES (?, ?)`).run(friendUserId, userId);
    res.json({ ok: true });
});
router.get('/', (req, res) => {
    const userId = req.user.id;
    const rows = db.prepare(`
		SELECT u.id, u.fullName, u.collegeId
		FROM friends f JOIN users u ON u.id = f.friendUserId
		WHERE f.userId = ?
		ORDER BY f.createdAt DESC
	`).all(userId);
    res.json(rows);
});
export default router;
