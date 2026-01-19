import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
export function signJwt(payload, secret, expiresIn = '7d') {
    return jwt.sign(payload, secret, { expiresIn });
}
export function verifyJwt(token, secret) {
    try {
        return jwt.verify(token, secret);
    }
    catch {
        return null;
    }
}
export async function hashPassword(plain) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(plain, salt);
}
export async function comparePassword(plain, hash) {
    return bcrypt.compare(plain, hash);
}
export function isAdult(age) {
    return age >= 18;
}
export function isValidCollegeId(collegeId) {
    // Allow longer college IDs and email-like formats
    return /^[A-Za-z0-9_\-@.]{4,100}$/.test(collegeId);
}
export function isAllowedEmail(email, allowedDomains) {
    if (!email)
        return true;
    if (allowedDomains.length === 0)
        return true; // Allow any email if no domains are specified
    const domain = email.split('@')[1]?.toLowerCase();
    return !!domain && allowedDomains.includes(domain);
}
