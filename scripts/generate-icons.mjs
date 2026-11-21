import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { generateMaskableAsset } from '@vite-pwa/assets-generator/api';

const source = await readFile(new URL('../public/icon.svg', import.meta.url));
const publicDir = new URL('../public/', import.meta.url);
await mkdir(publicDir, { recursive: true });
await writeFile(new URL('../public/favicon.svg', import.meta.url), source);

async function writeIcon(name, size, padding) {
  const image = await generateMaskableAsset('png', source, size, {
    padding,
    resizeOptions: { fit: 'contain', background: '#5b3df5' },
    outputOptions: { compressionLevel: 9 }
  });
  await image.toFile(fileURLToPath(new URL(name, publicDir)));
}

await Promise.all([
  writeIcon('pwa-192x192.png', 192, 0),
  writeIcon('pwa-512x512.png', 512, 0),
  writeIcon('pwa-maskable-512x512.png', 512, 0.4),
  writeIcon('apple-touch-icon.png', 180, 0)
]);
