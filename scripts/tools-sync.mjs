#!/usr/bin/env node
/**
 * tools-sync.mjs
 *
 * Zweck
 *  - Kopiert fertig gebaute, statische Dateien aus Submodules unter `external/`
 *    in das öffentliche Verzeichnis `public/embeds/<slug>`.
 *  - Diese Dateien werden anschließend per iframe im App‑Route `/tools/:slug` geladen.
 *
 * Warum .mjs?
 *  - .mjs aktiviert in Node.js das ESM‑Modulformat (import/export),
 *    ohne dass das Hauptprojekt `"type": "module"` setzt.
 *
 * Sicherheits-/Stabilitäts‑Aspekte
 *  - Nur Build‑Ordner werden akzeptiert (`docs`, `dist`, `build`).
 *  - Es wird nach einer `index.html` gesucht (bis Tiefe 2),
 *    damit z. B. Angular‑Builds (`dist/<name>/browser/`) gefunden werden.
 *  - Einfache Heuristik filtert Dev‑Indizes (Vite/Webpack/HMR/localhost),
 *    um Reload‑Loops zu verhindern.
 *  - Inkrementell: Kopiert nur bei geändertem Submodule‑Commit. Erzwingen mit `FORCE=1`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Konfiguration der Tools, die synchronisiert werden
const tools = [
  {
    slug: 'randomizer',
    srcRoot: 'external/tools/randomizer',
    // Only accept built outputs to avoid dev-index reload loops
    candidates: ['docs', 'dist', 'build'],
    destRoot: 'public/embeds/randomizer',
  },
];

// Rekursive Kopie mit kleinen Ausschlüssen (VCS/CI/node_modules)
const copyRecursive = (src, dest) => {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      // Skip VCS/CI files and node_modules
      if (['.git', '.github', '.gitignore', '.gitattributes', 'node_modules'].includes(entry)) continue;
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else if (stat.isFile()) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
};

// Ablage für den zuletzt synchronisierten Commit je Tool
const stateDir = path.resolve('.tools-sync');
fs.mkdirSync(stateDir, { recursive: true });

let changed = false;
for (const t of tools) {
  const base = path.resolve(t.srcRoot);
  if (!fs.existsSync(base)) {
    console.warn(`[tools-sync] Quelle fehlt: ${t.slug} (${t.srcRoot}) — Submodule noch nicht ausgecheckt?`);
    continue;
  }

  // Inkrementell: vergleiche Submodule‑HEAD mit zuletzt synchronisiertem Stand
  const rev = spawnSync('git', ['-C', base, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  const head = rev.status === 0 ? String(rev.stdout).trim() : 'unknown';
  const revFile = path.join(stateDir, `${t.slug}.rev`);
  const last = fs.existsSync(revFile) ? fs.readFileSync(revFile, 'utf8').trim() : '';
  const dest = path.resolve(t.destRoot);
  const force = process.env.FORCE === '1' || process.env.FORCE === 'true';
  if (!force && head && last === head && fs.existsSync(dest)) {
    console.log(`[tools-sync] ${t.slug}: unverändert (${head.slice(0,7)}). Überspringe Kopie.`);
    continue;
  }
  let sourceDir = undefined;
  for (const c of t.candidates) {
    const p = path.resolve(base, c);
    if (fs.existsSync(p)) {
      // Finde einen Ordner mit index.html (Tiefe 0..2), z. B. dist/<name>/browser/
      let candidateDir = undefined;
      const hasIndex = (dir) => fs.existsSync(path.join(dir, 'index.html'));
      const tryDepth = (dir, depth) => {
        if (candidateDir) return;
        if (depth > 2) return;
        if (hasIndex(dir)) {
          candidateDir = dir;
          return;
        }
        if (depth === 2) return;
        try {
          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const e of entries) {
            if (!e.isDirectory()) continue;
            tryDepth(path.join(dir, e.name), depth + 1);
            if (candidateDir) return;
          }
        } catch {}
      };
      tryDepth(p, 0);
      if (!candidateDir) continue;
      // Sanity: Dev‑Indizes überspringen (vite/webpack/localhost/hmr)
      try {
        const ix = fs.readFileSync(path.join(candidateDir, 'index.html'), 'utf8');
        const devHints = /(vite\.|webpack|localhost:|ng\s+serve|hmr)/i.test(ix);
        if (devHints) {
          console.warn(`[tools-sync] ${t.slug}: '${path.relative(base, candidateDir)}/index.html' sieht nach Dev aus – überspringe.`);
          continue;
        }
      } catch {}
      sourceDir = candidateDir;
      break;
    }
  }
  if (!sourceDir) {
    console.warn(`[tools-sync] Kein geeigneter Build-Ordner gefunden für ${t.slug}. Erwartet eine der ${t.candidates.join(', ')} mit index.html (kein Dev-Index).`);
    continue;
  }
  console.log(`[tools-sync] Kopiere ${sourceDir} → ${dest}`);
  fs.rmSync(dest, { recursive: true, force: true });
  copyRecursive(sourceDir, dest);
  changed = true;

  if (head && head !== 'unknown') {
    fs.writeFileSync(revFile, head, 'utf8');
  }
}

if (!changed) {
  console.log('[tools-sync] Nichts zu kopieren.');
}
