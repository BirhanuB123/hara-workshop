import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';
import { env } from './config.js';

// Neon computes suspend when idle, so allow a slower first connection and drop idle sockets early.
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  max: 10,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: 30_000,
});
export const prisma = new PrismaClient({ adapter });
