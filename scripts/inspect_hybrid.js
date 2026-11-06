const fs = require('fs');

const content = fs.readFileSync('frontend/src/data/catalogProducts.ts', 'utf8');
const jsonText = content
  .replace(/^import[^\n]*\n+/m, '')
  .replace(/^export const CATALOG_PRODUCTS: Product\[\] = /m, '')
  .replace(/;\s*$/, '');

const products = JSON.parse(jsonText);
const hybrid = products.filter(p => p.service_category === 'HYBRID_METAL_WOOD');

console.log('Total hybrid products:', hybrid.length);
hybrid.forEach((p, idx) => {
  console.log(`${idx + 1}. [${p.sku}] "${p.name}"`);
  console.log(`   Category: ${p.category_name} / ${p.subcategory}`);
  console.log(`   Primary Image: ${p.primary_image}`);
  console.log(`   Images array: ${JSON.stringify(p.images ? p.images.map(img => img.image) : [])}`);
  console.log(`   Description: ${p.description}`);
  console.log(`   Material: ${p.material || 'N/A'}`);
  console.log('----------------------------------------------------');
});
