import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../db.js';
import { env } from '../config.js';
import { asyncHandler, clean, isEmail, isUuid } from '../lib/http.js';
import { validatePhone } from '../lib/phone.js';
import { cloudinaryReady, destroyUpload, uploadBuffer } from '../lib/cloudinary.js';
import { mediaUrl } from '../lib/media.js';
import { iso, money } from '../lib/serialize.js';
import { escapeHtml, groupChatId, newLinkToken, sendTelegram } from '../lib/telegram.js';
import { quoteLimiter } from '../middleware/limits.js';

export const quotationsRouter = Router();

const MAX_FILES = 10, MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.dxf', '.dwg', '.webp']);
const IMAGES = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES + 1, files: 40 } }).any();

const SERVICE_MAP: Record<string, string> = {
  'Metal Works (Fabrication & Welding)': 'Metal Works', 'Wood Works (Carpentry & Custom Furniture)': 'Wood Works',
  'Hybrid Metal + Wood Construction': 'Hybrid Metal + Wood Construction', 'Hybrid Metal + Wood': 'Hybrid Metal + Wood Construction',
  METAL: 'Metal Works', WOOD: 'Wood Works', HYBRID: 'Hybrid Metal + Wood Construction',
  'metal-works': 'Metal Works', 'metal-work': 'Metal Works', 'wood-works': 'Wood Works', 'wood-work': 'Wood Works',
  'hybrid-metal-wood': 'Hybrid Metal + Wood Construction', 'hybrid-metal-wood-construction': 'Hybrid Metal + Wood Construction',
  'hybrid-metal-and-wood': 'Hybrid Metal + Wood Construction',
};

class Bad extends Error {}
const fail = (msg: string): never => { throw new Bad(msg); };
const first = (...vals: unknown[]) => { for (const v of vals) { const c = clean(v); if (c) return c; } return ''; };
const truthy = (v: unknown) => ['true', '1', 'yes'].includes(String(v ?? '').toLowerCase());

function dimension(raw: unknown, label: string): number | null {
  const s = clean(raw);
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return fail(`${label} must be a valid number.`);
  if (n <= 0 || n > 999999.99) return fail(`${label} must be between 0.01 and 999999.99 cm.`);
  return Math.round(n * 100) / 100;
}
function magicOk(ext: string, b: Buffer): boolean {
  if (ext === '.pdf') return b.subarray(0, 5).toString('latin1') === '%PDF-';
  if (ext === '.png') return b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (ext === '.jpg' || ext === '.jpeg') return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (ext === '.webp') return b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP';
  return true;
}
const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

async function nextQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const last = await prisma.quote.findFirst({ where: { quote_number: { startsWith: `QT-${year}` } }, orderBy: { created_at: 'desc' } });
  const seq = last ? (parseInt(last.quote_number.split('-').pop() ?? '', 10) || (await prisma.quote.count())) + 1 : 1;
  return `QT-${year}-${String(seq).padStart(4, '0')}`;
}

function serializeQuote(qt: any, attachments: any[]) {
  return {
    id: qt.id, quote_number: qt.quote_number, customer: qt.customer_id, customer_name: qt.customer_name,
    customer_phone: qt.customer_phone, customer_email: qt.customer_email, product: qt.product_id,
    product_code: qt.product_code, product_name: qt.product_name, product_category: qt.product_category,
    product_image_url: qt.product_image_url, project_title: qt.project_title, service_type: qt.service_type,
    description: qt.description, material_preference: qt.material_preference,
    width_cm: money(qt.width_cm), height_cm: money(qt.height_cm), length_cm: money(qt.length_cm), quantity: qt.quantity,
    calculated_volume_m3: money(qt.calculated_volume_m3, 4), estimated_baseline_amount: money(qt.estimated_baseline_amount),
    preferred_completion_date: day(qt.preferred_completion_date), installation_required: qt.installation_required,
    delivery_required: qt.delivery_required, delivery_address: qt.delivery_address, site_location: qt.site_location,
    status: qt.status, materials_cost: money(qt.materials_cost), labor_cost: money(qt.labor_cost),
    transportation_cost: money(qt.transportation_cost), installation_cost: money(qt.installation_cost),
    additional_charges: money(qt.additional_charges), discount: money(qt.discount), subtotal: money(qt.subtotal),
    total_amount: money(qt.total_amount), expiration_date: day(qt.expiration_date), workshop_notes: qt.workshop_notes,
    customer_notes: qt.customer_notes, telegram_chat_id: qt.telegram_chat_id, telegram_linked_at: iso(qt.telegram_linked_at),
    telegram_deep_link: qt.telegram_link_token ? `https://t.me/${env.TELEGRAM_BOT_USERNAME.replace(/^@/, '')}?start=${qt.telegram_link_token}` : null,
    items: [], attachments: attachments.map((a) => ({ id: a.id, file: mediaUrl(a.file), file_name: a.file_name, created_at: iso(a.created_at) })),
    created_at: iso(qt.created_at), updated_at: iso(qt.updated_at),
  };
}

quotationsRouter.post('/quotations', quoteLimiter, (req, res, next) => {
  upload(req, res, (err: unknown) => {
    if (!err) return next();
    const tooBig = err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE';
    res.status(400).json({ error: tooBig ? 'A file exceeds maximum allowed size of 25MB.' : 'Invalid upload request.' });
  });
}, asyncHandler(async (req, res) => {
  const uploaded: { public_id: string; resource_type: string }[] = [];
  try {
    const d = req.body ?? {};
    const customer_name = first(d.customer_name);
    if (!customer_name) fail('Customer Name is required.');
    if (customer_name.length > 200) fail('Customer Name cannot exceed 200 characters.');
    const ph = validatePhone(first(d.customer_phone, d.phone_number, d.phone));
    if (!ph.ok) fail(ph.error);
    const customer_phone = (ph as { ok: true; phone: string }).phone;
    const customer_email = first(d.customer_email, d.email);
    if (!customer_email || customer_email.length > 254 || !isEmail(customer_email)) fail('A valid Email address is required.');
    const project_title = first(d.project_title, d.title);
    if (!project_title) fail('Project Title is required.');
    if (project_title.length > 200) fail('Project Title cannot exceed 200 characters.');
    const service_type_raw = first(d.service_type, d.service_category);
    if (!service_type_raw) fail('Service Category is required.');
    const description = first(d.description, d.notes);
    if (!description) fail('Project Description & Specific Requirements are required.');
    const material_preference = clean(d.material_preference);
    if (material_preference.length > 200) fail('Material Preference cannot exceed 200 characters.');
    const customer_notes = clean(d.customer_notes);
    const service_type = SERVICE_MAP[service_type_raw] ?? service_type_raw;
    if (service_type.length > 100) fail('Service Category cannot exceed 100 characters.');

    let quantity = 1;
    const rawQty = clean(d.quantity);
    if (rawQty) {
      if (!/^-?\d+$/.test(rawQty)) fail('Quantity must be a valid integer.');
      quantity = parseInt(rawQty, 10);
      if (quantity < 1 || quantity > 1_000_000) fail('Quantity must be between 1 and 1,000,000.');
    }
    const length_cm = dimension(d.length_cm, 'Length (cm)'), width_cm = dimension(d.width_cm, 'Width (cm)'), height_cm = dimension(d.height_cm, 'Height (cm)');
    let volume: string | null = null;
    if (length_cm !== null && width_cm !== null && height_cm !== null) {
      const v = (length_cm / 100) * (width_cm / 100) * (height_cm / 100);
      if (v > 999999.9999) fail('Calculated volume exceeds supported dimensions.');
      volume = v.toFixed(4);
    }
    const delivery_required = truthy(d.delivery_required), installation_required = truthy(d.installation_required);
    const site_location = first(d.site_location, d.delivery_address);
    if (site_location.length > 255) fail('Site Location cannot exceed 255 characters.');
    let preferred: Date | null = null;
    const rawDate = clean(d.preferred_completion_date);
    if (rawDate) {
      const dt = /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? new Date(`${rawDate}T00:00:00Z`) : null;
      if (!dt || Number.isNaN(+dt) || dt.toISOString().slice(0, 10) !== rawDate) fail('Preferred Completion Date must be a valid YYYY-MM-DD date.');
      preferred = dt;
    }

    // Selected product (id, sku or slug)
    const ident = first(d.product, d.product_id, d.product_code, d.sku);
    const product = ident
      ? await prisma.product.findFirst({
          where: { OR: [...(isUuid(ident) ? [{ id: ident }] : []), { sku: { equals: ident, mode: 'insensitive' } }, { slug: { equals: ident, mode: 'insensitive' } }] },
          include: { images: true },
        })
      : null;
    const primaryImg = product ? ([...product.images].sort((a, b) => Number(b.is_primary) - Number(a.is_primary))[0]?.image ?? '') : '';
    const product_code = first(d.product_code, product?.sku), product_name = first(d.product_name, product?.name);
    const product_category = first(d.product_category, product?.subcategory);
    const product_image_url = first(d.product_image_url, primaryImg ? mediaUrl(primaryImg) : '');
    if (product_code.length > 100 || product_name.length > 200 || product_category.length > 100 || product_image_url.length > 500)
      fail('Product metadata exceeds maximum allowed length.');

    let baseline: Prisma.Decimal | null = null;
    const hasPrice = Boolean(product && product.starting_price.gt(0));
    if (product && hasPrice) {
      baseline = product.starting_price.mul(quantity);
      if (delivery_required) baseline = baseline.add(1500);
      if (installation_required) baseline = baseline.add(2500);
    }

    // Attachments: validate everything BEFORE writing anything.
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const accepted = ['attachments', 'file', 'attachment', 'drawing_file', 'drawings', 'files'];
    const inbound = files.some((f) => f.fieldname === 'attachments') ? files.filter((f) => f.fieldname === 'attachments') : files.filter((f) => accepted.includes(f.fieldname));
    if (inbound.length > MAX_FILES) fail(`A maximum of ${MAX_FILES} files can be attached per request.`);
    const valid = inbound.map((f) => {
      const safe = path.basename(f.originalname || '').replace(/[^\w.\- ]+/g, '_').slice(0, 255) || 'attachment';
      const ext = path.extname(safe).toLowerCase();
      if (!ext || !ALLOWED.has(ext)) return fail(`Unsupported file format "${ext || 'none'}". Allowed formats: PDF, PNG, JPG, JPEG, DXF, DWG, WEBP.`);
      if (f.size <= 0) return fail(`File "${safe}" is empty.`);
      if (f.size > MAX_BYTES) return fail(`File "${safe}" exceeds maximum allowed size of 25MB.`);
      if (!magicOk(ext, f.buffer)) return fail(ext === '.pdf' ? `File "${safe}" is not a valid PDF document.` : `File "${safe}" could not be verified as a valid ${ext.slice(1).toUpperCase()} file.`);
      return { f, safe, ext };
    });
    if (valid.length && !cloudinaryReady()) {
      console.error('[quotes] Cloudinary is not configured; cannot store attachments');
      res.status(500).json({ error: 'Unable to save your quotation request and attachments. Please try again.' });
      return;
    }
    for (const v of valid) {
      const r = await uploadBuffer(v.f.buffer, 'quotes', v.safe);
      uploaded.push({ public_id: r.public_id, resource_type: r.resource_type });
      (v as any).url = r.url;
    }

    const expiration = new Date(); expiration.setUTCDate(expiration.getUTCDate() + 15); expiration.setUTCHours(0, 0, 0, 0);
    let quote: any = null, attachments: any[] = [];
    for (let attempt = 0; attempt < 3 && !quote; attempt++) {
      try {
        const quote_number = await nextQuoteNumber();
        [quote, ...attachments] = await prisma.$transaction([
          prisma.quote.create({
            data: {
              quote_number, customer_name, customer_phone, customer_email, product_id: product?.id ?? null,
              product_code, product_name, product_category, product_image_url, project_title, service_type, description,
              material_preference: material_preference || null,
              length_cm, width_cm, height_cm, quantity, calculated_volume_m3: volume, estimated_baseline_amount: baseline,
              total_amount: 0, subtotal: 0, delivery_required, installation_required,
              delivery_address: site_location || null, site_location, preferred_completion_date: preferred,
              customer_notes: customer_notes || null, status: 'SUBMITTED', expiration_date: expiration,
            },
          }),
          ...valid.map((v: any) => prisma.quoteAttachment.create({ data: { quote: { connect: { quote_number } }, file: v.url, file_name: v.safe } })),
        ]);
      } catch (err) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002' && attempt < 2) continue; // quote_number race
        throw err;
      }
    }

    // Telegram notification + single-use deep link (never block the customer's success response)
    let telegram_status = 'skipped'; let telegram_details: Record<string, string> = {};
    const chat = groupChatId();
    const files_line = attachments.length ? `\n<b>Attachments:</b> ${attachments.length}\n${attachments.map((a: any) => escapeHtml(a.file)).join('\n')}` : '';
    const tg = await sendTelegram(chat,
      `🛠 <b>NEW QUOTE REQUEST ${escapeHtml(quote.quote_number)}</b>\n\n<b>Customer:</b> ${escapeHtml(customer_name)}\n<b>Phone:</b> ${escapeHtml(customer_phone)}\n<b>Email:</b> ${escapeHtml(customer_email)}\n\n` +
      `<b>Project:</b> ${escapeHtml(project_title)}\n<b>Service:</b> ${escapeHtml(service_type)}\n` +
      (product_name ? `<b>Product:</b> ${escapeHtml(product_name)} ${product_code ? `(${escapeHtml(product_code)})` : ''}\n` : '') +
      `<b>Quantity:</b> ${quantity}\n` + (site_location ? `<b>Site:</b> ${escapeHtml(site_location)}\n` : '') +
      `<b>Delivery:</b> ${delivery_required ? 'Yes' : 'No'}  <b>Installation:</b> ${installation_required ? 'Yes' : 'No'}\n\n<b>Details:</b>\n${escapeHtml(description.slice(0, 1500))}${files_line}`);
    if (tg) { telegram_status = tg.ok ? 'sent' : 'failed'; telegram_details = { group: tg.ok ? 'delivered' : 'failed' }; }

    const link = newLinkToken();
    try {
      await prisma.$transaction([
        prisma.telegramOrderLink.create({ data: { quote_id: quote.id, token: link.token, expires_at: link.expires_at, is_used: false } }),
        prisma.quote.update({ where: { id: quote.id }, data: { telegram_link_token: link.token, telegram_token_expires_at: link.expires_at } }),
      ]);
      quote.telegram_link_token = link.token;
    } catch (err) { console.error('[quotes] link token failed:', (err as Error).message); }

    res.status(201).json({
      status: 'success', id: quote.id, message: 'Your project request has been received.',
      quote_number: quote.quote_number, project_title: quote.project_title, product_name: quote.product_name,
      product_code: quote.product_code, service_category: quote.service_type, quantity: quote.quantity,
      has_predefined_price: hasPrice, estimated_baseline: hasPrice && baseline ? Number(baseline.toFixed(2)) : null,
      price_message: hasPrice ? null : 'Price will be provided after reviewing your request.',
      telegram_status, telegram_details, telegram_link_token: link.token,
      telegram_bot_username: env.TELEGRAM_BOT_USERNAME.replace(/^@/, ''), telegram_deep_link: link.deep_link,
      quote: serializeQuote(quote, attachments),
      ...(quote.calculated_volume_m3 ? { calculated_volume_m3: Number(quote.calculated_volume_m3.toString()) } : {}),
    });
  } catch (err) {
    await Promise.all(uploaded.map((u) => destroyUpload(u.public_id, u.resource_type)));
    if (err instanceof Bad) { res.status(400).json({ error: err.message }); return; }
    console.error('[quotes] create failed:', err);
    res.status(500).json({ error: 'Unable to save your quotation request and attachments. Please try again.' });
  }
}));
