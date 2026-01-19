import { Router } from 'express';
import db from './db.js';
import { z } from 'zod';
const router = Router();
router.get('/me', (req, res) => {
    const userId = req.user.id;
    const profile = db.prepare(`
		SELECT u.id, u.collegeId, u.fullName, u.age, u.gender,
		       p.bio, p.hobbies, p.interests, p.habits, p.avatarUrl
		FROM users u JOIN profiles p ON p.userId = u.id
		WHERE u.id = ?
	`).get(userId);
    res.json(profile);
});
const UpdateSchema = z.object({
    bio: z.string().max(500).optional(),
    hobbies: z.array(z.string()).max(30).optional(),
    interests: z.array(z.string()).max(30).optional(),
    habits: z.array(z.string()).max(30).optional(),
    avatarUrl: z.string().url().optional()
});
router.put('/me', (req, res) => {
    const parsed = UpdateSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const userId = req.user.id;
    const { bio, hobbies, interests, habits, avatarUrl } = parsed.data;
    db.prepare(`
		UPDATE profiles
		SET bio = COALESCE(?, bio),
		    hobbies = COALESCE(?, hobbies),
		    interests = COALESCE(?, interests),
		    habits = COALESCE(?, habits),
		    avatarUrl = COALESCE(?, avatarUrl)
		WHERE userId = ?
	`).run(bio ?? null, hobbies ? JSON.stringify(hobbies) : null, interests ? JSON.stringify(interests) : null, habits ? JSON.stringify(habits) : null, avatarUrl ?? null, userId);
    res.json({ ok: true });
});
export default router;
