#!/usr/bin/env node
/**
 * tools-build.mjs
 *
 * Zweck
 *  - Baut externe Tool-Repos, die als Git-Submodule im Ordner `external/` liegen.
 *  - Ziel: Ein statischer Build (z. B. in `dist/`, `build/` oder `docs/`),
 *    den `tools-sync.mjs` anschließend in das öffentliche Verzeichnis kopiert.
 *
 * Warum .mjs?
 *  - .mjs aktiviert in Node.js standardmäßig das ESM‑Modulformat (import/export),
 *    ohne dass das Hauptprojekt `"type": "module"` setzen muss.
 *
 * Funktionsweise
 *  - Für jedes Tool wird geprüft, ob ein `package.json` mit `scripts.build` existiert.
 *  - Wenn ja: optional `npm ci` (falls keine node_modules vorhanden), dann `npm run build`.
 *  - Wenn nein: es wird nichts gebaut (reine HTML/Static‑Repos sind ok).
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// Liste der Tools, die gebaut werden sollen.
// - slug: kurzer Bezeichner
// - cwd: Pfad zum Submodule
// - build: optionaler Custom‑Build‑Befehl; wenn undefiniert, wird auto‑detektiert
const tools = [
  {
    slug: 'randomizer',
    cwd: 'external/tools/randomizer',
    // If undefined, auto-detect: run `npm ci` (when node_modules missing) then `npm run build` if available
    build: undefined,
  },
];

// Kleiner Helfer zum Ausführen von Kommandos mit Fehlerabbruch
const run = (cmd, args, opts) => {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed`);
};

for (const t of tools) {
  const repoDir = path.resolve(t.cwd);
  if (!fs.existsSync(repoDir)) {
    console.warn(`[tools-build] Quelle fehlt: ${t.slug} (${t.cwd}). Überspringe.`);
    continue;
  }

  if (t.build) {
    console.log(`[tools-build] ${t.slug}: custom build → ${t.build}`);
    run('bash', ['-lc', t.build], { cwd: repoDir });
    continue;
  }

  // Auto‑Erkennung: package.json vorhanden?
  const pkgPath = path.join(repoDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.log(`[tools-build] ${t.slug}: kein package.json gefunden – überspringe Build (evtl. reine HTML-App).`);
    continue;
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const hasBuild = pkg.scripts && pkg.scripts.build;

  if (!hasBuild) {
    console.log(`[tools-build] ${t.slug}: kein build-Script – überspringe Build.`);
    continue;
  }

  // Dependencies nur installieren, wenn node_modules fehlt (schneller bei wiederholtem Build)
  const nm = path.join(repoDir, 'node_modules');
  if (!fs.existsSync(nm)) {
    console.log(`[tools-build] ${t.slug}: npm ci`);
    run('npm', ['ci'], { cwd: repoDir });
  } else {
    console.log(`[tools-build] ${t.slug}: node_modules vorhanden – Installation übersprungen.`);
  }

  console.log(`[tools-build] ${t.slug}: npm run build`);
  run('npm', ['run', 'build'], { cwd: repoDir });
}

console.log('[tools-build] Fertig.');
