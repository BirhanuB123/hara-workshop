import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOrigins } from './config.js';
import { globalLimiter } from './middleware/limits.js';
import { HttpError } from './lib/http.js';
import { settingsRouter } from './routes/settings.js';
import { productsRouter } from './routes/products.js';
import { servicesRouter } from './routes/services.js';
import { contactRouter } from './routes/contact.js';
import { quotationsRouter } from './routes/quotations.js';

export const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const ok = corsOrigins.includes(origin.replace(/\/$/, '')) || /^https:\/\/hara-workshop[a-z0-9-]*\.vercel\.app$/.test(origin);
    cb(null, ok);
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(globalLimiter);

const health = (_req: Request, res: Response) => res.json({ status: 'ok', service: 'hara-api' });
app.get(['/', '/health', '/api/health'], health);

app.use('/api', settingsRouter, productsRouter, servicesRouter, contactRouter, quotationsRouter);

app.use((_req, res) => { res.status(404).json({ detail: 'Not found.' }); });
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) { res.status(err.status).json(err.body); return; }
  console.error('[api] unhandled error:', err);
  res.status(500).json({ detail: 'Internal server error.' });
});
