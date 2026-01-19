import { Router } from 'express';
import db from './db.js';
import { z } from 'zod';
import { hashPassword, comparePassword, signJwt, isAdult, isValidCollegeId, isAllowedEmail } from './utils.js';
const router = Router();
const env = process.env;
const JWT_SECRET = env.JWT_SECRET || 'dev-secret';
const ALLOWED_EMAIL_DOMAINS = (env.ALLOWED_EMAIL_DOMAINS ?? '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
// Schema updated to support real college ID formats like RAKESH.20231CSE0670@presidencyuniversity.in
const RegisterSchema = z.object({
    collegeId: z.string().min(4).max(200), // Increased to 200 to support long college IDs
    password: z.string().min(6).max(100),
    age: z.number().int().nonnegative(),
    fullName: z.string().min(2).max(80),
    email: z.string().email().optional(),
    gender: z.string().optional()
});
router.post('/register', async (req, res) => {
    const parsed = RegisterSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { collegeId, password, age, fullName, email, gender } = parsed.data;
    if (!isAdult(age))
        return res.status(400).json({ error: 'You must be 18+' });
    if (!isValidCollegeId(collegeId))
        return res.status(400).json({ error: 'Invalid college ID' });
    if (!isAllowedEmail(email, ALLOWED_EMAIL_DOMAINS))
        return res.status(400).json({ error: 'Email domain not allowed' });
    try {
        const passwordHash = await hashPassword(password);
        const stmt = db.prepare(`
			INSERT INTO users (collegeId, email, passwordHash, fullName, age, gender)
			VALUES (?, ?, ?, ?, ?, ?)
		`);
        const info = stmt.run(collegeId, email ?? null, passwordHash, fullName, age, gender ?? null);
        db.prepare(`INSERT INTO profiles (userId, bio, hobbies, interests, habits, avatarUrl)
			VALUES (?, '', '[]', '[]', '[]', '')`).run(info.lastInsertRowid);
        const token = signJwt({ id: info.lastInsertRowid, collegeId }, JWT_SECRET);
        res.json({ token });
    }
    catch (e) {
        if (e.code === 'SQLITE_CONSTRAINT_UNIQUE')
            return res.status(409).json({ error: 'College ID already registered' });
        res.status(500).json({ error: 'Server error' });
    }
});
const LoginSchema = z.object({
    collegeId: z.string().min(4).max(32),
    password: z.string().min(6).max(100)
});
router.post('/login', async (req, res) => {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const { collegeId, password } = parsed.data;
    const user = db.prepare(`SELECT id, passwordHash FROM users WHERE collegeId = ?`).get(collegeId);
    if (!user)
        return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await comparePassword(password, user.passwordHash);
    if (!ok)
        return res.status(401).json({ error: 'Invalid credentials' });
    const token = signJwt({ id: user.id, collegeId }, JWT_SECRET);
    res.json({ token });
});
export default router;
