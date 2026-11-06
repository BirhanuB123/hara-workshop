const fs = require('fs');

const content = fs.readFileSync('frontend/src/data/catalogProducts.ts', 'utf8');
const jsonText = content
  .replace(/^import[^\n]*\n+/m, '')
  .replace(/^export const CATALOG_PRODUCTS: Product\[\] = /m, '')
  .replace(/;\s*$/, '');

const products = JSON.parse(jsonText);
const hybrid = products.filter(p => p.service_category === 'HYBRID_METAL_WOOD');

const summary = hybrid.map((p, idx) => ({
  index: idx + 1,
  id: p.id,
  sku: p.sku,
  name: p.name,
  name_am: p.name_am,
  category: p.category_name,
  subcategory: p.subcategory,
  primary_image: p.primary_image,
  description: p.description,
  material: p.material
}));

fs.writeFileSync('scripts/hybrid_summary.json', JSON.stringify(summary, null, 2));
console.log('Saved', summary.length, 'hybrid products to scripts/hybrid_summary.json');
