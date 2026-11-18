import { Router, type Request } from 'express';
import type { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../db.js';
import { HttpError, asyncHandler, isUuid } from '../lib/http.js';
import { pageParams, paginated } from '../lib/pagination.js';
import { serializeCategory, serializeProduct } from '../lib/serialize.js';
import { STANDARD_SUBCATEGORIES, SUBCATEGORY_AMHARIC_MAP } from '../lib/subcategories.js';
import { isStaff } from '../middleware/auth.js';

export const productsRouter = Router();

const SLUG_TO_CATEGORY: Record<string, string> = {
  'metal-works': 'METAL_WORKS', 'wood-works': 'WOOD_WORKS',
  'hybrid-metal-wood': 'HYBRID_METAL_WOOD', 'hybrid-metal-wood-construction': 'HYBRID_METAL_WOOD',
};
const q = (req: Request, k: string): string => (typeof req.query[k] === 'string' ? (req.query[k] as string).trim() : '');
const bool = (v: string) => ['true', '1', 'yes'].includes(v.toLowerCase());
const ci = (v: string) => ({ equals: v, mode: 'insensitive' as const });

function normalizeCategory(raw: string): string {
  const n = raw.trim().toUpperCase().replace(/[- ]/g, '_');
  if (n.includes('HYBRID')) return 'HYBRID_METAL_WOOD';
  if (n.includes('WOOD')) return 'WOOD_WORKS';
  if (n.includes('METAL')) return 'METAL_WORKS';
  return n;
}
const subcategoryMatch = (en: string, am: string): Prisma.ProductWhereInput => ({
  OR: [{ subcategory: ci(en) }, { subcategory_am: ci(am) }, { category: { name: ci(en) } }, { category: { name_am: ci(am) } }, { product_type: ci(en) }],
});

function productWhere(req: Request): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];
  const sc = q(req, 'service_category'); if (sc) and.push({ service_category: normalizeCategory(sc) });
  const ss = SLUG_TO_CATEGORY[q(req, 'service_slug').toLowerCase()]; if (ss) and.push({ service_category: ss });
  const sub = q(req, 'subcategory'); if (sub && sub.toLowerCase() !== 'all') and.push(subcategoryMatch(sub, sub));
  const service = q(req, 'service'); if (service) and.push(isUuid(service) ? { service_id: service } : { id: '00000000-0000-0000-0000-000000000000' });
  if (q(req, 'service__slug')) and.push({ service: { slug: q(req, 'service__slug') } });
  const cat = q(req, 'category'); if (cat) and.push(isUuid(cat) ? { category_id: cat } : { id: '00000000-0000-0000-0000-000000000000' });
  if (q(req, 'category__slug')) and.push({ category: { slug: q(req, 'category__slug') } });
  if (q(req, 'product_type')) and.push({ product_type: q(req, 'product_type') });
  if (q(req, 'stock_status')) and.push({ stock_status: q(req, 'stock_status') });
  if (q(req, 'slug')) and.push({ slug: q(req, 'slug') });
  for (const f of ['is_featured', 'is_customizable'] as const) if (q(req, f)) and.push({ [f]: bool(q(req, f)) });
  if (q(req, 'is_active')) and.push({ is_active: bool(q(req, 'is_active')) });
  if (!isStaff(req)) and.push({ is_active: true });
  const terms = q(req, 'search').split(/[\s,]+/).filter(Boolean);
  const fields = ['name', 'name_am', 'sku', 'material', 'material_am', 'description', 'description_am', 'detailed_description', 'product_type', 'subcategory', 'subcategory_am', 'applications'] as const;
  for (const t of terms) and.push({ OR: fields.map((f) => ({ [f]: { contains: t, mode: 'insensitive' as const } })) });
  return and.length ? { AND: and } : {};
}

function productOrder(req: Request): Prisma.ProductOrderByWithRelationInput[] {
  const allowed = ['starting_price', 'created_at', 'name'];
  const parts = q(req, 'ordering').split(',').map((s) => s.trim()).filter(Boolean)
    .filter((s) => allowed.includes(s.replace(/^-/, '')))
    .map((s) => ({ [s.replace(/^-/, '')]: s.startsWith('-') ? 'desc' : 'asc' }) as Prisma.ProductOrderByWithRelationInput);
  return parts.length ? parts : [{ is_featured: 'desc' }, { created_at: 'desc' }];
}
const include = { images: true, category: true, service: true } as const;

productsRouter.get('/products', asyncHandler(async (req, res) => {
  const { size, page, skip } = pageParams(req);
  try {
    const where = productWhere(req);
    const [count, rows] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({ where, include, orderBy: productOrder(req), skip, take: size }),
    ]);
    res.json(paginated(req, rows.map(serializeProduct), count, page, size));
  } catch (err) {
    // Django's list handler never returns a 500 for the catalog; mirror that.
    console.error('[products] list failed:', err);
    res.json({ count: 0, next: null, previous: null, results: [] });
  }
}));

productsRouter.get('/products/subcategories', asyncHandler(async (req, res) => {
  const sc = q(req, 'service_category');
  const target = sc ? normalizeCategory(sc) : SLUG_TO_CATEGORY[q(req, 'service_slug').toLowerCase()];
  const cats = target && STANDARD_SUBCATEGORIES[target] ? [target] : Object.keys(STANDARD_SUBCATEGORIES);
  const result: Record<string, unknown> = {};
  for (const cat of cats) {
    const list = STANDARD_SUBCATEGORIES[cat];
    const base: Prisma.ProductWhereInput = { service_category: cat, is_active: true };
    const counts: Record<string, number> = {};
    for (const item of list) counts[item] = await prisma.product.count({ where: { AND: [base, subcategoryMatch(item, SUBCATEGORY_AMHARIC_MAP[item] ?? item)] } });
    result[cat] = {
      service_category: cat, subcategories: list,
      subcategories_am: list.map((i) => SUBCATEGORY_AMHARIC_MAP[i] ?? i),
      subcategory_map: Object.fromEntries(list.map((i) => [i, SUBCATEGORY_AMHARIC_MAP[i] ?? i])),
      counts, total_products: await prisma.product.count({ where: base }),
    };
  }
  res.json(target && result[target] ? result[target] : result);
}));

productsRouter.get('/products/categories', asyncHandler(async (req, res) => {
  const and: Prisma.CategoryWhereInput[] = [];
  if (!isStaff(req)) and.push({ is_active: true });
  const svc = SLUG_TO_CATEGORY[q(req, 'service_slug').toLowerCase()] ?? (q(req, 'service_category') ? q(req, 'service_category').toUpperCase() : '');
  if (svc) and.push({ products: { some: { service_category: svc, is_active: true } } });
  for (const t of q(req, 'search').split(/[\s,]+/).filter(Boolean))
    and.push({ OR: [{ name: { contains: t, mode: 'insensitive' } }, { description: { contains: t, mode: 'insensitive' } }] });
  const rows = await prisma.category.findMany({ where: { AND: and }, orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } });
  res.json(rows.map((c) => serializeCategory(c, c._count.products)));
}));

productsRouter.get('/products/categories/:id', asyncHandler(async (req, res) => {
  const id = String(req.params.id);
  const c = isUuid(id) ? await prisma.category.findFirst({ where: { id, ...(isStaff(req) ? {} : { is_active: true }) }, include: { _count: { select: { products: true } } } }) : null;
  if (!c) throw new HttpError(404, { detail: 'Not found.' });
  res.json(serializeCategory(c, c._count.products));
}));

productsRouter.get('/products/:lookup', asyncHandler(async (req, res) => {
  const v = String(req.params.lookup).trim();
  const vis: Prisma.ProductWhereInput = isStaff(req) ? {} : { is_active: true };
  let p = isUuid(v) ? await prisma.product.findFirst({ where: { ...vis, id: v }, include }) : null;
  p ??= await prisma.product.findFirst({ where: { ...vis, sku: ci(v) }, include });
  p ??= await prisma.product.findFirst({ where: { ...vis, slug: ci(v) }, include });
  if (!p) throw new HttpError(404, { detail: 'Not found.' });
  res.json(serializeProduct(p));
}));
