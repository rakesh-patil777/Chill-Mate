import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from './utils.js';

export interface AuthenticatedRequest extends Request {
	user?: { id: number; collegeId: string };
}

export function requireAuth(secret: string) {
	return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
		const header = req.headers.authorization;
		if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
		const token = header.slice(7);
		const payload = verifyJwt<{ id: number; collegeId: string }>(token, secret);
		if (!payload) return res.status(401).json({ error: 'Invalid token' });
		req.user = payload;
		next();
	};
}


