#!/usr/bin/env node
// Precompress files in a folder to .br and .gz (Brotli + Gzip) without extra deps
// Usage: node scripts/precompress.mjs dist/KuhLabs/browser

import { createReadStream, createWriteStream, promises as fs } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGzip, constants as zConsts } from 'node:zlib';
import { brotliCompress } from 'node:zlib';

const compressible = new Set(['.js', '.css', '.html', '.svg', '.json', '.txt', '.xml']);

async function brCompress(src, dest) {
  const input = await fs.readFile(src);
  const output = await new Promise((resolve, reject) =>
    brotliCompress(
      input,
      {
        params: {
          [zConsts.BROTLI_PARAM_QUALITY]: 11,
        },
      },
      (err, buf) => (err ? reject(err) : resolve(buf))
    )
  );
  await fs.writeFile(dest, output);
}

async function gzCompress(src, dest) {
  await fs.mkdir(dirname(dest), { recursive: true });
  await pipeline(createReadStream(src), createGzip({ level: 9 }), createWriteStream(dest));
}

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(p);
    } else {
      yield p;
    }
  }
}

async function main() {
  const root = process.argv[2];
  if (!root) {
    console.error('Usage: node scripts/precompress.mjs <folder>');
    process.exit(1);
  }
  let count = 0;
  for await (const p of walk(root)) {
    const ext = extname(p).toLowerCase();
    if (!compressible.has(ext)) continue;
    try {
      await brCompress(p, p + '.br');
      await gzCompress(p, p + '.gz');
      count++;
    } catch (e) {
      console.warn('Failed to compress', p, e?.message || e);
    }
  }
  console.log(`Precompressed ${count} files under ${root}`);
}

main();

