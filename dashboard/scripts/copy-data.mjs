import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dashboardDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dashboardDir, '..', '..');
const sourceDir = path.join(projectRoot, 'src', 'scripts', 'data', 'json');
const targetDir = path.join(projectRoot, 'dashboard', 'public', 'data');

const requiredFiles = [
  'fact_all.json',
  'dim_date.json',
  'dim_country.json',
  'dim_product.json',
  'dim_customer.json',
  'most_purchased_products.json',
  'rfm.json'
];

await rm(targetDir, { recursive: true, force: true });
await mkdir(targetDir, { recursive: true });

for (const file of requiredFiles) {
  const source = path.join(sourceDir, file);
  const target = path.join(targetDir, file);
  try {
    await cp(source, target);
  } catch {
    throw new Error(`Arquivo obrigatório não encontrado: ${source}`);
  }
}

console.log(`Dados copiados de ${sourceDir} para ${targetDir}`);
