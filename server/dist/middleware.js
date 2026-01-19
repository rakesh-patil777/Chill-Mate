import { verifyJwt } from './utils.js';
export function requireAuth(secret) {
    return (req, res, next) => {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer '))
            return res.status(401).json({ error: 'Unauthorized' });
        const token = header.slice(7);
        const payload = verifyJwt(token, secret);
        if (!payload)
            return res.status(401).json({ error: 'Invalid token' });
        req.user = payload;
        next();
    };
}
