import * as crypto from 'crypto';

/**
 * Generate a 6-character room code
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a unique player ID
 */
export function generatePlayerId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Create a device hash from user agent and IP
 */
export function createDeviceHash(userAgent: string, ip: string): string {
  return crypto
    .createHash('sha256')
    .update(`${userAgent}-${ip}-${Date.now()}`)
    .digest('hex')
    .substring(0, 16);
}

/**
 * Calculate points based on answer speed
 */
export function calculatePoints(
  isCorrect: boolean,
  basePoints: number,
  speedFactor: number,
  answerTimeMs: number,
  timeLimitMs: number
): number {
  if (!isCorrect) return 0;
  
  const timeRatio = Math.max(0, (timeLimitMs - answerTimeMs) / timeLimitMs);
  const speedBonus = Math.floor(basePoints * speedFactor * timeRatio);
  
  return basePoints + speedBonus;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize display name
 */
export function sanitizeDisplayName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .substring(0, 20);
}

/**
 * Check if numeric answer is correct within tolerance
 */
export function checkNumericAnswer(
  answer: number,
  correctValue: number,
  tolerance: number = 0
): boolean {
  return Math.abs(answer - correctValue) <= tolerance;
}
