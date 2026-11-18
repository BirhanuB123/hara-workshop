import { Router } from 'express';
import { prisma } from '../db.js';
import { asyncHandler, clean, isEmail } from '../lib/http.js';
import { validatePhone } from '../lib/phone.js';
import { escapeHtml, groupChatId, sendTelegram } from '../lib/telegram.js';
import { contactLimiter } from '../middleware/limits.js';

export const contactRouter = Router();

contactRouter.post(['/contact', '/core/contact'], contactLimiter, asyncHandler(async (req, res) => {
  const b = req.body ?? {};
  const name = clean(b.name), email = clean(b.email), subject = clean(b.subject), message = clean(b.message);
  const errors: Record<string, string> = {};

  if (!name) errors.name = 'Customer name is required.';
  else if (name.length > 200) errors.name = 'Name cannot exceed 200 characters.';
  const phoneRes = validatePhone(clean(b.phone));
  if (!phoneRes.ok) errors.phone = phoneRes.error;
  if (subject.length > 200) errors.subject = 'Subject cannot exceed 200 characters.';
  if (!message) errors.message = 'Message is required.';
  else if (message.length > 5000) errors.message = 'Message cannot exceed 5000 characters.';
  if (email) {
    if (email.length > 254) errors.email = 'Email cannot exceed 254 characters.';
    else if (!isEmail(email)) errors.email = 'Please enter a valid email address.';
  }
  if (Object.keys(errors).length) {
    res.status(400).json({ errors, message: 'Please correct the highlighted fields and try again.' });
    return;
  }
  const phone = (phoneRes as { ok: true; phone: string }).phone;
  const emailDisplay = email || 'Not provided';
  const when = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Addis_Ababa', hour12: true });
  const chatId = groupChatId();

  // 1. Persist first so an inquiry is never lost.
  let auditId: string | null = null;
  try {
    const row = await prisma.auditLog.create({
      data: {
        action: 'CREATE', resource: 'ContactInquiry',
        metadata: { name, phone, email: emailDisplay, subject, message, submission_time: when, target_chat_id: chatId, delivery_status: 'PENDING' },
      },
    });
    auditId = row.id;
  } catch (err) {
    console.warn('[contact] audit log failed:', (err as Error).message);
  }

  // 2. Deliver to the management Telegram group.
  const html =
    '📬 <b>HARA WORKSHOP — NEW CUSTOMER INQUIRY</b>\n\n' +
    `<b>Customer Name:</b> ${escapeHtml(name)}\n<b>Phone Number:</b> ${escapeHtml(phone)}\n` +
    `<b>Email Address:</b> ${escapeHtml(emailDisplay)}\n` +
    (subject ? `<b>Subject:</b> ${escapeHtml(subject)}\n` : '') +
    `<b>Submission Time:</b> ${escapeHtml(when)}\n\n<b>Message:</b>\n${escapeHtml(message)}\n\n<i>HARA WORKSHOP • Bole Arabsa Management</i>`;
  const tg = await sendTelegram(chatId, html);

  if (tg?.ok) {
    const messageId = tg.result?.message_id;
    if (auditId) {
      await prisma.auditLog.update({
        where: { id: auditId },
        data: { resource_id: messageId ? String(messageId) : null, metadata: { name, phone, email: emailDisplay, subject, message, submission_time: when, target_chat_id: chatId, delivery_status: 'DELIVERED', telegram_message_id: messageId ?? null } },
      }).catch(() => undefined);
    }
    res.json({ success: true, telegram_delivered: true, message: 'Your inquiry has been successfully sent to the workshop management.', telegram_message_id: messageId });
    return;
  }
  res.json({ success: true, telegram_delivered: false, message: 'Your message has been saved. Our team will review it shortly.' });
}));
