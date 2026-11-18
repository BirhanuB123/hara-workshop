/**
 * Uploads your existing Django media folder to Cloudinary, keeping each file's relative path as its public id,
 * so the paths already stored in the database (e.g. products/gate.jpg) resolve to
 * https://res.cloudinary.com/<cloud>/image/upload/products/gate.jpg
 *
 *   npm run media:upload -- ./media
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { v2 as cloudinary } from 'cloudinary';

const root = process.argv[2];
if (!root || !fs.existsSync(root)) { console.error('Usage: npm run media:upload -- <path to Django MEDIA_ROOT>'); process.exit(1); }
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });

const files: string[] = [];
(function walk(d: string) { for (const f of fs.readdirSync(d, { withFileTypes: true })) f.isDirectory() ? walk(path.join(d, f.name)) : files.push(path.join(d, f.name)); })(root);

let ok = 0, failed = 0;
for (const file of files) {
  const rel = path.relative(root, file).split(path.sep).join('/');
  const publicId = rel.replace(/\.[^.]+$/, '');
  try {
    await cloudinary.uploader.upload(file, { public_id: publicId, resource_type: 'auto', overwrite: false, use_filename: false });
    ok++; console.log('uploaded', rel);
  } catch (e) { failed++; console.error('FAILED', rel, (e as Error).message); }
}
console.log(`Done: ${ok} uploaded, ${failed} failed.`);
