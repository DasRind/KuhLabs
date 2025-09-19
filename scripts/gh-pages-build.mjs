#!/usr/bin/env node
/**
 * gh-pages-build.mjs
 *
 * Baut das Angular-Projekt für GitHub Pages.
 * - Ermittelt ein sinnvolles baseHref (Repo-Name oder GH_PAGES_BASE_HREF).
 * - Führt `ng build` im Produktionsmodus aus.
 * - Kopiert das Browser-Build nach `docs/` und legt `.nojekyll` + `404.html` an.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const MIN_NODE_MAJOR = 20;
const nodeVersion = process.versions.node;
const nodeMajor = Number(nodeVersion.split('.')[0]);
if (!Number.isFinite(nodeMajor) || nodeMajor < MIN_NODE_MAJOR) {
  console.error(`[#gh-pages] Benötige Node.js >= ${MIN_NODE_MAJOR}. Aktuell: ${nodeVersion}.`);
  process.exit(1);
}

const repoRoot = process.cwd();
const docsDir = path.resolve(repoRoot, 'docs');
const distDir = path.resolve(repoRoot, 'dist');
const browserDir = path.resolve(distDir, 'KuhLabs', 'browser');

const deriveBaseHref = () => {
  const override = process.env.GH_PAGES_BASE_HREF ?? process.env.BASE_HREF ?? '';
  if (override) {
    return normalizeBaseHref(override);
  }
  const cname = readCustomDomain();
  if (cname) {
    return '/';
  }

  try {
    const remote = spawnSync('git', ['remote', 'get-url', '--push', 'origin'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (remote.status !== 0) throw new Error(remote.stderr?.toString() ?? 'git exit code');
    const url = String(remote.stdout).trim();
    if (!url) return '/';
    const name = extractRepoName(url);
    if (!name) return '/';
    if (name.endsWith('.github.io')) {
      return '/';
    }
    return normalizeBaseHref(`/${name}/`);
  } catch {
    return '/';
  }
};

const normalizeBaseHref = (value) => {
  const trimmed = String(value).trim();
  if (trimmed === '.' || trimmed === './') return './';
  if (!trimmed) return '/';
  let normalized = trimmed;
  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`;
  }
  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }
  return normalized.replace(/\/+$/, '/');
};

const extractRepoName = (remoteUrl) => {
  let sanitized = remoteUrl.trim();
  if (!sanitized) return '';
  sanitized = sanitized.replace(/\.git$/, '');
  if (sanitized.startsWith('git@')) {
    const idx = sanitized.indexOf(':');
    sanitized = idx >= 0 ? sanitized.slice(idx + 1) : sanitized;
  } else {
    try {
      const parsed = new URL(sanitized);
      sanitized = parsed.pathname;
    } catch {}
  }
  sanitized = sanitized.replace(/^\/+/, '');
  const parts = sanitized.split('/').filter(Boolean);
  return parts.at(-1) ?? '';
};

const baseHref = deriveBaseHref();
console.log(`[#gh-pages] Verwende baseHref='${baseHref}'`);

const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
console.log('[#gh-pages] Starte Angular-Build …');
const build = spawnSync(npxBin, [
  'ng',
  'build',
  '--configuration',
  'production',
  '--base-href',
  baseHref,
], {
  cwd: repoRoot,
  stdio: 'inherit',
});

if (build.status !== 0) {
  console.error(`[#gh-pages] Build fehlgeschlagen (Exit ${build.status ?? 'unknown'}).`);
  process.exit(build.status ?? 1);
}

if (!fs.existsSync(browserDir)) {
  console.error(`[#gh-pages] Erwarteter Browser-Ordner fehlt: ${path.relative(repoRoot, browserDir)}`);
  process.exit(1);
}

console.log(`[#gh-pages] Kopiere Browser-Build nach ${path.relative(repoRoot, docsDir)}/`);
fs.rmSync(docsDir, { recursive: true, force: true });
copyRecursive(browserDir, docsDir);

const noJekyll = path.join(docsDir, '.nojekyll');
fs.writeFileSync(noJekyll, '');

const cnameValue = readCustomDomain();
if (cnameValue) {
  fs.writeFileSync(path.join(docsDir, 'CNAME'), `${cnameValue}\n`, 'utf8');
}

const indexHtml = path.join(docsDir, 'index.html');
const fallbackHtml = path.join(docsDir, '404.html');
if (fs.existsSync(indexHtml)) {
  fs.copyFileSync(indexHtml, fallbackHtml);
}

console.log('[#gh-pages] Fertig! Committe & pushe `docs/` nach main, um GitHub Pages zu aktualisieren.');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
    return;
  }
  if (stat.isFile()) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return;
  }
}

function readCustomDomain() {
  const cnameCandidates = [
    path.resolve(repoRoot, 'CNAME'),
    path.resolve(docsDir, 'CNAME'),
  ];
  for (const file of cnameCandidates) {
    try {
      if (fs.existsSync(file)) {
        const content = fs.readFileSync(file, 'utf8').trim();
        if (content) {
          return content;
        }
      }
    } catch {}
  }
  return '';
}
