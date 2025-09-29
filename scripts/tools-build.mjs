#!/usr/bin/env node
/**
 * tools-build.mjs
 *
 * Purpose
 *  - Builds external tool repositories that live as Git submodules under `external/`.
 *  - Goal: produce a static build output (dist/build/docs) so tools-sync.mjs can copy it into public embeds.
 *
 * Why .mjs?
 *  - .mjs enables ESM syntax (import/export) in Node.js without forcing the main project to set `"type": "module"`.
 *
 * How it works
 *  - For each tool we check for package.json with scripts.build.
 *  - If present: optionally run npm ci (only if node_modules is missing) and then npm run build.
 *  - Otherwise we skip (static HTML repos are allowed).
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

// Tools to build
// - slug: short identifier
// - cwd: path to the submodule
// - build: optional custom build command; auto-detect when undefined
const tools = [
  {
    slug: 'randomizer',
    cwd: 'external/tools/randomizer',
    // Auto mode: run npm ci (if needed) and npm run build
    build: undefined,
  },
];

// Run helper that aborts on non-zero exit codes
const run = (cmd, args, opts = {}) => {
  const spawnOpts = { stdio: 'inherit', ...opts };
  if (isWin && spawnOpts.shell === undefined) {
    spawnOpts.shell = true;
  }
  const r = spawnSync(cmd, args, spawnOpts);
  if (r.status !== 0) throw new Error(`${cmd} ${args.join(' ')} failed`);
};

for (const t of tools) {
  const repoDir = path.resolve(t.cwd);
  if (!fs.existsSync(repoDir)) {
    console.warn(`[tools-build] Missing source: ${t.slug} (${t.cwd}). Skipping.`);
    continue;
  }

  if (t.build) {
    console.log(`[tools-build] ${t.slug}: custom build -> ${t.build}`);
    if (isWin) {
      run('powershell.exe', ['-NoProfile', '-Command', t.build], { cwd: repoDir, shell: false });
    } else {
      run('bash', ['-lc', t.build], { cwd: repoDir, shell: false });
    }
    continue;
  }

  const pkgPath = path.join(repoDir, 'package.json');
  if (!fs.existsSync(pkgPath)) {
    console.log(`[tools-build] ${t.slug}: no package.json found -> skipping build (probably static).`);
    continue;
  }
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const hasBuild = pkg.scripts && pkg.scripts.build;

  if (!hasBuild) {
    console.log(`[tools-build] ${t.slug}: no build script -> skipping.`);
    continue;
  }

  const nm = path.join(repoDir, 'node_modules');
  if (!fs.existsSync(nm)) {
    console.log(`[tools-build] ${t.slug}: npm ci`);
    run(npmCmd, ['ci'], { cwd: repoDir });
  } else {
    console.log(`[tools-build] ${t.slug}: node_modules present -> skipping install.`);
  }

  console.log(`[tools-build] ${t.slug}: npm run build`);
  run(npmCmd, ['run', 'build'], { cwd: repoDir });
}

console.log('[tools-build] Done.');
