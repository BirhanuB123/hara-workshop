import { Router, type Request } from 'express';
import type { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../db.js';
import { HttpError, asyncHandler, isUuid } from '../lib/http.js';
import { pageParams, paginated } from '../lib/pagination.js';
import { serializeService } from '../lib/serialize.js';
import { isStaff } from '../middleware/auth.js';

export const servicesRouter = Router();
const q = (req: Request, k: string): string => (typeof req.query[k] === 'string' ? (req.query[k] as string).trim() : '');
const include = { category: true, gallery_images: true } as const;

const SLUG_ALIASES: string[][] = [
  ['hybrid-metal-wood', 'hybrid-metal-wood-construction', 'hybrid-metal-and-wood'],
  ['metal-works', 'metal-work'],
  ['wood-works', 'wood-work'],
];
const RELATED_CATEGORIES: Record<string, string[]> = {
  'Metal Works': ['METAL'], 'Wood Works': ['WOOD'], 'Hybrid Metal + Wood Construction': ['CUSTOM', 'FURNITURE', 'DOORS'],
};

async function withRelated(s: any) {
  const [projects, services] = await Promise.all([
    prisma.project.findMany({
      where: { category: { in: RELATED_CATEGORIES[s.title] ?? ['CUSTOM', 'METAL', 'WOOD'] }, is_published: true },
      orderBy: [{ is_featured: 'desc' }, { created_at: 'desc' }], take: 4,
      include: { images: { orderBy: { created_at: 'asc' }, take: 1 } },
    }),
    prisma.service.findMany({
      where: { is_active: true, id: { not: s.id } }, orderBy: [{ category: { name: 'asc' } }, { title: 'asc' }], take: 2, include,
    }),
  ]);
  return serializeService(s, { projects, services });
}

servicesRouter.get('/services', asyncHandler(async (req, res) => {
  const { size, page, skip } = pageParams(req);
  const and: Prisma.ServiceWhereInput[] = [];
  if (!isStaff(req)) and.push({ is_active: true });
  if (q(req, 'is_active') && isStaff(req)) and.push({ is_active: ['true', '1', 'yes'].includes(q(req, 'is_active').toLowerCase()) });
  const cat = q(req, 'category'); if (cat) and.push(isUuid(cat) ? { category_id: cat } : { id: '00000000-0000-0000-0000-000000000000' });
  for (const t of q(req, 'search').split(/[\s,]+/).filter(Boolean))
    and.push({ OR: ['title', 'short_description', 'full_description', 'tagline'].map((f) => ({ [f]: { contains: t, mode: 'insensitive' as const } })) });
  const where: Prisma.ServiceWhereInput = and.length ? { AND: and } : {};
  const [count, rows] = await Promise.all([
    prisma.service.count({ where }),
    prisma.service.findMany({ where, include, orderBy: [{ category: { name: 'asc' } }, { title: 'asc' }], skip, take: size }),
  ]);
  const results = await Promise.all(rows.map(withRelated));
  res.json(paginated(req, results, count, page, size));
}));

servicesRouter.get('/services/categories', asyncHandler(async (_req, res) => {
  const cats = await prisma.serviceCategory.findMany({ orderBy: { name: 'asc' }, include: { services: { where: { is_active: true }, include } } });
  res.json(await Promise.all(cats.map(async (c) => ({
    id: c.id, name: c.name, name_am: c.name_am, slug: c.slug, description: c.description,
    services: await Promise.all(c.services.map(withRelated)),
  }))));
}));

servicesRouter.get('/services/:lookup', asyncHandler(async (req, res) => {
  const v = String(req.params.lookup).trim();
  const vis: Prisma.ServiceWhereInput = isStaff(req) ? {} : { is_active: true };
  let s = isUuid(v) ? await prisma.service.findFirst({ where: { ...vis, id: v }, include }) : null;
  if (!s) {
    const slugs = SLUG_ALIASES.find((g) => g.includes(v)) ?? [v];
    s = await prisma.service.findFirst({ where: { ...vis, slug: { in: slugs } }, include });
  }
  if (!s) throw new HttpError(404, { detail: 'Not found.' });
  res.json(await withRelated(s));
}));
