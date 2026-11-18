import { Router } from 'express';
import { prisma } from '../db.js';
import { asyncHandler } from '../lib/http.js';
import { mediaUrl } from '../lib/media.js';
import { iso, money } from '../lib/serialize.js';

export const settingsRouter = Router();

/** Public workshop settings. Served at /api/settings/ AND /api/core/public-settings/ (Django had the former admin-only). */
settingsRouter.get(['/settings', '/core/public-settings'], asyncHandler(async (_req, res) => {
  const s = (await prisma.workshopSettings.findFirst()) ?? (await prisma.workshopSettings.create({ data: {} }));
  res.json({
    id: s.id, name: s.name, tagline: s.tagline, phone: s.phone, email: s.email, telegram: s.telegram,
    address: s.address, address_amharic: s.address_amharic, working_hours: s.working_hours, currency: s.currency,
    vat_percentage: money(s.vat_percentage), quote_validity_days: s.quote_validity_days,
    logo: mediaUrl(s.logo), created_at: iso(s.created_at), updated_at: iso(s.updated_at),
  });
}));
