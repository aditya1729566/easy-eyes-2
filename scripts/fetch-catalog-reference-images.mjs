import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const dataset = 'shravya11/eyeglasses-dataset';
const revision = '7011dd3ac628040a8885a4b597399409643a9e04';
const root = process.cwd();
const products = JSON.parse(await readFile(path.join(root, 'data/catalog-demo.json'), 'utf8'));
const output = path.join(root, 'public/assets/catalog-reference');

if (products.length !== 120 || products.some(item => item.status !== 'draft' || item.stock !== 0 || !/^[a-z0-9-]+$/.test(item.slug)) || new Set(products.map(item => item.slug)).size !== 120) {
  throw new Error('Expected 120 out-of-stock draft concepts.');
}

async function get(url) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`${response.status} ${url}`);
      return response;
    } catch (error) {
      if (attempt === 3) throw error;
      await new Promise(resolve => setTimeout(resolve, attempt * 750));
    }
  }
  throw new Error('Unreachable');
}

async function list(directory) {
  const url = `https://huggingface.co/api/datasets/${dataset}/tree/${revision}/${directory}?recursive=false&expand=false`;
  return await (await get(url)).json();
}

const wanted = {
  eyeglasses: products.filter(item => item.product_type === 'optical').length,
  sunglasses: products.filter(item => item.product_type === 'sunglasses').length,
};
const folders = {};
for (const [category, count] of Object.entries(wanted)) {
  const entries = (await list(`train/${category}`))
    .filter(item => item.type === 'directory')
    .sort((a, b) => Number(a.path.split('/').at(-1)) - Number(b.path.split('/').at(-1)));
  if (entries.length < count) throw new Error(`Not enough ${category} folders`);
  folders[category] = Array.from({ length: count }, (_, index) =>
    entries[Math.floor((index + 0.5) * entries.length / count)].path);
}

await mkdir(output, { recursive: true });
const positions = { eyeglasses: 0, sunglasses: 0 };
const jobs = products.map(product => {
  const category = product.product_type === 'optical' ? 'eyeglasses' : 'sunglasses';
  return { product, category, folder: folders[category][positions[category]++] };
});
const manifest = new Array(jobs.length);
let next = 0;

async function worker() {
  while (next < jobs.length) {
    const index = next++;
    const { product, category, folder } = jobs[index];
    const files = await list(`${folder}/product`);
    const file = files.find(item => item.type === 'file' && /_0\.jpe?g$/i.test(item.path));
    if (!file) throw new Error(`No product-only front photo in ${folder}`);
    const sourceUrl = `https://huggingface.co/datasets/${dataset}/resolve/${revision}/${file.path}`;
    const bytes = Buffer.from(await (await get(sourceUrl)).arrayBuffer());
    if (bytes.length > 5_000_000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) {
      throw new Error(`Unexpected JPEG in ${file.path}`);
    }
    const localPath = `/assets/catalog-reference/${product.slug}.jpg`;
    await writeFile(path.join(root, 'public', localPath), bytes);
    manifest[index] = { slug: product.slug, category, localPath, sourcePath: file.path, sourceUrl };
    if ((index + 1) % 20 === 0) process.stdout.write(`Prepared ${index + 1}/${jobs.length}\n`);
  }
}

await Promise.all(Array.from({ length: 8 }, () => worker()));
await writeFile(path.join(root, 'data/catalog-reference-manifest.json'), `${JSON.stringify({
  dataset: `https://huggingface.co/datasets/${dataset}`,
  revision,
  license: 'CC BY 4.0',
  images: manifest,
}, null, 2)}\n`);
console.log(`Prepared ${manifest.length} product-only glasses photos.`);
