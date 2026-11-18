import type { Request } from 'express';

/**
 * Placeholder until the auth phase (JWT login) lands: every caller is treated as an anonymous visitor,
 * so only active catalog rows are returned, exactly like Django does for non-staff users.
 */
export const isStaff = (_req: Request): boolean => false;
