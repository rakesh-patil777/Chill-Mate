import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export function signJwt(payload: object, secret: string, expiresIn = '7d'): string {
	return jwt.sign(payload, secret, { expiresIn } as any);
}

export function verifyJwt<T>(token: string, secret: string): T | null {
	try { return jwt.verify(token, secret) as T; } catch { return null; }
}

export async function hashPassword(plain: string): Promise<string> {
	const salt = await bcrypt.genSalt(10);
	return bcrypt.hash(plain, salt);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
	return bcrypt.compare(plain, hash);
}

export function isAdult(age: number): boolean {
	return age >= 18;
}

export function isValidCollegeId(collegeId: string): boolean {
	// Allow longer college IDs and email-like formats
	return /^[A-Za-z0-9_\-@.]{4,100}$/.test(collegeId);
}

export function isAllowedEmail(email: string | undefined, allowedDomains: string[]): boolean {
	if (!email) return true;
	if (allowedDomains.length === 0) return true; // Allow any email if no domains are specified
	const domain = email.split('@')[1]?.toLowerCase();
	return !!domain && allowedDomains.includes(domain);
}


