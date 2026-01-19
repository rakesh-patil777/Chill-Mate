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
	collegeId: z.string().min(4).max(255), // Increased to 255 to support long college IDs
	password: z.string().min(6).max(100),
	age: z.number().int().nonnegative(),
	fullName: z.string().min(2).max(80),
	email: z.string().email().optional(),
	gender: z.string().optional()
});

router.post('/register', async (req, res) => {
	const parsed = RegisterSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

	const { collegeId, password, age, fullName, email, gender } = parsed.data;
	
	// Normalize collegeId: trim whitespace and convert to lowercase for consistent storage
	const normalizedCollegeId = collegeId.trim().toLowerCase();

	if (!isAdult(age)) return res.status(400).json({ error: 'You must be 18+' });
	if (!isValidCollegeId(normalizedCollegeId)) return res.status(400).json({ error: 'Invalid college ID' });
	if (!isAllowedEmail(email, ALLOWED_EMAIL_DOMAINS)) return res.status(400).json({ error: 'Email domain not allowed' });

	try {
		const passwordHash = await hashPassword(password);
		const stmt = db.prepare(`
			INSERT INTO users (collegeId, email, passwordHash, fullName, age, gender)
			VALUES (?, ?, ?, ?, ?, ?)
		`);
		const info = stmt.run(normalizedCollegeId, email ?? null, passwordHash, fullName, age, gender ?? null);

		db.prepare(`INSERT INTO profiles (userId, bio, hobbies, interests, habits, avatarUrl)
			VALUES (?, '', '[]', '[]', '[]', '')`).run(info.lastInsertRowid as number);

		const token = signJwt({ id: info.lastInsertRowid, collegeId: normalizedCollegeId }, JWT_SECRET);
		res.json({ token });
	} catch (e: any) {
		if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'College ID already registered' });
		res.status(500).json({ error: 'Server error' });
	}
});

const LoginSchema = z.object({
	collegeId: z.string(),
	password: z.string()
});

router.post('/login', async (req, res) => {
	const parsed = LoginSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

	const { collegeId, password } = parsed.data;

	try {
		// Use case-insensitive comparison with trimming to handle whitespace and case differences
		// This works with both old data (mixed case) and new data (normalized to lowercase)
		const normalizedCollegeId = collegeId.trim().toLowerCase();
		const user = db.prepare('SELECT * FROM users WHERE LOWER(TRIM(collegeId)) = ?').get(normalizedCollegeId) as any;
		if (!user) return res.status(401).json({ error: 'Invalid credentials' });

		const valid = await comparePassword(password, user.passwordHash);
		if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

		const token = signJwt({ id: user.id, collegeId: user.collegeId }, JWT_SECRET);
		res.json({ token });
	} catch (e) {
		res.status(500).json({ error: 'Server error' });
	}
});

export default router;
