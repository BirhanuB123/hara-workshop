import { app } from './app.js';
import { env } from './config.js';
import { prisma } from './db.js';

const server = app.listen(env.PORT, () => console.log(`Hara API listening on :${env.PORT}`));
const stop = async () => { server.close(); await prisma.$disconnect(); process.exit(0); };
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
