import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { AdminUser } from '@/db/schema';
import { query } from '@/lib/db';

const SESSION_COOKIE_NAME = 'ts_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours
const SECRET = process.env.ADMIN_SESSION_SECRET || 'thirupathi_steels_salem_secure_session_secret_2026_key!';

/**
 * PBKDF2 Password Hashing
 * Format: iterations:saltHex:hashHex
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const iterations = 100000;
  const keylen = 64;
  const digest = 'sha512';
  const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest);
  return `${iterations}:${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [iterationsStr, salt, hash] = storedHash.split(':');
    const iterations = parseInt(iterationsStr, 10);
    const keylen = 64;
    const digest = 'sha512';
    const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest);
    return crypto.timingSafeEqual(Buffer.from(derivedKey.toString('hex')), Buffer.from(hash));
  } catch (err) {
    return false;
  }
}

/**
 * Session Token Generation (HMAC-SHA256 Signed JSON)
 */
export interface SessionPayload {
  id: string;
  username: string;
  fullName: string;
  role: 'admin' | 'yard_manager';
  exp: number;
}

export function signSessionToken(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }
    const payload: SessionPayload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Extract authenticated user from request cookie or Authorization header
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AdminUser | null> {
  // 1. Check HTTP-only cookie
  let token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // 2. Check Authorization Bearer header as fallback for tests/API clients
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }
  }

  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  return {
    id: payload.id,
    username: payload.username,
    full_name: payload.fullName,
    role: payload.role,
    is_active: true,
    created_at: new Date(payload.exp - SESSION_MAX_AGE_SECONDS * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Origin and CSRF header verification for mutation endpoints
 */
export function verifyMutationOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const referer = request.headers.get('referer');

  // Allow server-to-server or test requests if explicit internal authorization header is passed
  if (!origin && !referer && request.headers.get('authorization')) {
    return true;
  }

  if (origin && host) {
    try {
      const originUrl = new URL(origin);
      return originUrl.host === host;
    } catch {
      return false;
    }
  }

  if (referer && host) {
    try {
      const refererUrl = new URL(referer);
      return refererUrl.host === host;
    } catch {
      return false;
    }
  }

  return true;
}

/**
 * Set session cookie in response
 */
export function setSessionCookie(response: NextResponse, user: AdminUser): void {
  const payload: SessionPayload = {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    role: user.role,
    exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
  };

  const token = signSessionToken(payload);
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Login Abuse Protection / Rate Limiter
 * In-memory sliding tracker for failed login attempts by IP or username.
 */
interface FailedLoginRecord {
  count: number;
  lockedUntil: number | null;
  firstAttempt: number;
}

const loginAttempts = new Map<string, FailedLoginRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const WINDOW_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export function isLoginLocked(identifier: string): boolean {
  const record = loginAttempts.get(identifier);
  if (!record) return false;
  if (record.lockedUntil && Date.now() < record.lockedUntil) {
    return true;
  }
  // Clear expired lockout
  if (record.lockedUntil && Date.now() >= record.lockedUntil) {
    loginAttempts.delete(identifier);
    return false;
  }
  return false;
}

export function getLoginLockRemainingSeconds(identifier: string): number {
  const record = loginAttempts.get(identifier);
  if (!record || !record.lockedUntil) return 0;
  const remaining = Math.ceil((record.lockedUntil - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

export function recordFailedLogin(identifier: string): { attempts: number; locked: boolean; remainingSeconds: number } {
  const now = Date.now();
  let record = loginAttempts.get(identifier);

  if (!record || (now - record.firstAttempt > WINDOW_DURATION_MS && !record.lockedUntil)) {
    record = { count: 1, lockedUntil: null, firstAttempt: now };
  } else {
    record.count++;
  }

  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
  }

  loginAttempts.set(identifier, record);

  return {
    attempts: record.count,
    locked: record.lockedUntil !== null && now < record.lockedUntil,
    remainingSeconds: record.lockedUntil ? Math.ceil((record.lockedUntil - now) / 1000) : 0,
  };
}

export function resetLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

/**
 * Clear session cookie
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(SESSION_COOKIE_NAME);
}

export { SESSION_COOKIE_NAME };

