/**
 * Copies every table from the current Django PostgreSQL database (SOURCE_DATABASE_URL)
 * into the new Neon database (DATABASE_URL). Table/column names are identical, so no mapping is needed.
 *
 *   npm run db:push            # 1. create the tables in Neon from prisma/schema.prisma
 *   npm run db:copy            # 2. copy the data (safe to re-run: existing ids are skipped)
 *   npm run db:copy -- --dry   # only print row counts
 */
import 'dotenv/config';
import pg from 'pg';

const SRC = process.env.SOURCE_DATABASE_URL, DST = process.env.DATABASE_URL;
if (!SRC || !DST) { console.error('Set SOURCE_DATABASE_URL and DATABASE_URL.'); process.exit(1); }
const dry = process.argv.includes('--dry');
const ssl = (u: string) => (/localhost|127\.0\.0\.1/.test(u) ? undefined : { rejectUnauthorized: false });
const src = new pg.Client({ connectionString: SRC, ssl: ssl(SRC) });
const dst = new pg.Client({ connectionString: DST, ssl: ssl(DST) });
const q = (s: string) => `"${s.replace(/"/g, '""')}"`;

async function columns(c: pg.Client, table: string) {
  const r = await c.query(`select column_name, data_type from information_schema.columns where table_schema='public' and table_name=$1`, [table]);
  return new Map<string, string>(r.rows.map((x) => [x.column_name, x.data_type]));
}

/** Parents before children, using the target's foreign keys. */
async function copyOrder(): Promise<string[]> {
  const tables = (await dst.query(`select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' and table_name not like '\\_prisma%'`)).rows.map((r) => r.table_name as string);
  const fks = (await dst.query(`select cl.relname child, pl.relname parent from pg_constraint c join pg_class cl on cl.oid=c.conrelid join pg_class pl on pl.oid=c.confrelid where c.contype='f' and c.connamespace='public'::regnamespace`)).rows;
  const deps = new Map<string, Set<string>>(tables.map((t) => [t, new Set()]));
  for (const { child, parent } of fks) if (child !== parent) deps.get(child)?.add(parent);
  const out: string[] = [];
  while (deps.size) {
    const ready = [...deps].filter(([, d]) => [...d].every((p) => out.includes(p) || !deps.has(p))).map(([t]) => t);
    if (!ready.length) { out.push(...deps.keys()); break; }
    for (const t of ready.sort()) { out.push(t); deps.delete(t); }
  }
  return out;
}

await src.connect(); await dst.connect();
let total = 0;
for (const table of await copyOrder()) {
  const sCols = await columns(src, table);
  if (!sCols.size) { console.log(`- ${table}: not in source, skipped`); continue; }
  const dCols = await columns(dst, table);
  const cols = [...dCols.keys()].filter((c) => sCols.has(c));
  const count = Number((await src.query(`select count(*) from ${q(table)}`)).rows[0].count);
  if (dry || !count) { console.log(`- ${table}: ${count} rows${dry ? ' (dry run)' : ''}`); continue; }
  const jsonCols = new Set(cols.filter((c) => dCols.get(c) === 'jsonb' || dCols.get(c) === 'json'));
  const batch = 200; let inserted = 0;
  for (let off = 0; off < count; off += batch) {
    const rows = (await src.query(`select ${cols.map(q).join(',')} from ${q(table)} order by ${q(cols.includes('id') ? 'id' : cols[0])} limit ${batch} offset ${off}`)).rows;
    const values: unknown[] = [];
    const tuples = rows.map((r, i) => `(${cols.map((c, j) => {
      const v = r[c]; values.push(jsonCols.has(c) && v !== null ? JSON.stringify(v) : v); return `$${i * cols.length + j + 1}`;
    }).join(',')})`);
    const res = await dst.query(`insert into ${q(table)} (${cols.map(q).join(',')}) values ${tuples.join(',')} on conflict do nothing`, values);
    inserted += res.rowCount ?? 0;
  }
  total += inserted;
  const missing = [...dCols.keys()].filter((c) => !sCols.has(c));
  console.log(`- ${table}: ${inserted}/${count} copied${missing.length ? ` (target-only columns left to defaults: ${missing.join(', ')})` : ''}`);
}
console.log(dry ? 'Dry run finished.' : `Done. ${total} rows inserted.`);
await src.end(); await dst.end();
