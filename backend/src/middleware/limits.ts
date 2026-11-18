import rateLimit from 'express-rate-limit';
import { env } from '../config.js';

const hourly = (limit: number, message: string) =>
  rateLimit({
    windowMs: 60 * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false,
    message: { detail: message },
  });

export const contactLimiter = hourly(env.THROTTLE_CONTACT_PER_HOUR, 'Request was throttled. Please try again later.');
export const quoteLimiter = hourly(env.THROTTLE_QUOTE_PER_HOUR, 'Request was throttled. Please try again later.');
export const globalLimiter = rateLimit({ windowMs: 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false, message: { detail: 'Request was throttled.' } });
