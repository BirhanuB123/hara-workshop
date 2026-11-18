import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.string().default('development'),
  CORS_ORIGINS: z.string().default(''),
  PUBLIC_API_URL: z.string().default('http://localhost:8000'),
  JWT_ACCESS_SECRET: z.string().default('dev-access-secret'),
  JWT_REFRESH_SECRET: z.string().default('dev-refresh-secret'),
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),
  TELEGRAM_BOT_TOKEN: z.string().default(''),
  TELEGRAM_BOT_USERNAME: z.string().default('HaraWorkshopOrdersBot'),
  TELEGRAM_WEBHOOK_SECRET: z.string().default(''),
  TELEGRAM_GROUP_CHAT_ID: z.string().default(''),
  TELEGRAM_MANAGER_CHAT_ID: z.string().default(''),
  THROTTLE_CONTACT_PER_HOUR: z.coerce.number().default(10),
  THROTTLE_QUOTE_PER_HOUR: z.coerce.number().default(10),
});

export const env = schema.parse(process.env);
export const corsOrigins = env.CORS_ORIGINS.split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
