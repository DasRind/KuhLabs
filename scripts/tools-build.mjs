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
    build: undefined,
    ensureNodeModules: true,
    nxTarget: 'lineup-randomizer:build:production',
  },
  {
    slug: 'swarm-demos',
    cwd: 'external/tools/swarm-demos',
    build: 'npm run build -- --configuration production --base-href ./',
    ensureNodeModules: true,
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
  const hasPackageJson = fs.existsSync(pkgPath);
  const pkg = hasPackageJson ? JSON.parse(fs.readFileSync(pkgPath, 'utf8')) : null;
  const hasBuildScript = Boolean(pkg?.scripts?.build);

  if (t.ensureNodeModules && hasPackageJson) {
    const nm = path.join(repoDir, 'node_modules');
    if (!fs.existsSync(nm)) {
      console.log(`[tools-build] ${t.slug}: npm ci (${t.cwd})`);
      try {
        run(npmCmd, ['ci'], { cwd: repoDir });
      } catch (error) {
        console.warn(`[tools-build] ${t.slug}: npm ci failed (${error.message}). Retrying with npm install --legacy-peer-deps.`);
        run(npmCmd, ['install', '--legacy-peer-deps'], { cwd: repoDir });
      }
    } else {
      console.log(`[tools-build] ${t.slug}: node_modules present -> skipping install.`);
    }
  }

  const hasNx = fs.existsSync(path.join(repoDir, 'nx.json'));
  if (hasNx && t.nxTarget) {
    const npxCmd = isWin ? 'npx.cmd' : 'npx';
    console.log(`[tools-build] ${t.slug}: npx nx run ${t.nxTarget}`);
    run(npxCmd, ['nx', 'run', t.nxTarget], { cwd: repoDir });
    continue;
  }

  if (hasBuildScript) {
    console.log(`[tools-build] ${t.slug}: npm run build`);
    run(npmCmd, ['run', 'build'], { cwd: repoDir });
    continue;
  }

  console.log(`[tools-build] ${t.slug}: no recognized build target -> skipping.`);
}

console.log('[tools-build] Done.');
