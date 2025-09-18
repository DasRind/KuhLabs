#!/usr/bin/env node
/**
 * tools-update.mjs
 *
 * Aktualisiert die hinterlegten Tool-Repositories (klassische Clones oder Submodules).
 * - Führt `git fetch --prune` aus.
 * - Prüft auf lokale Änderungen und überspringt bei Dirty-Worktrees.
 * - Aktualisiert den gewünschten Branch via `git pull --ff-only` (oder Upstream-Konfig).
 * - Gibt alte und neue Commits aus, damit nachvollziehbar bleibt, was gebaut wird.
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const tools = [
  {
    slug: 'randomizer',
    cwd: 'external/tools/randomizer',
    remote: 'origin',
    branch: 'main',
  },
];

const repoRoot = process.cwd();
const args = new Set(process.argv.slice(2));
const filterActive = args.size > 0;

for (const tool of tools) {
  if (filterActive && !args.has(tool.slug)) continue;

  const repoPath = path.resolve(repoRoot, tool.cwd);
  if (!fs.existsSync(repoPath)) {
    console.warn(`[tools-update] ${tool.slug}: Pfad fehlt (${tool.cwd}) – überspringe.`);
    continue;
  }

  if (!isGitWorktree(repoPath)) {
    console.warn(`[tools-update] ${tool.slug}: Kein Git-Repository erkannt – überspringe.`);
    continue;
  }

  if (!isWorktreeClean(repoPath)) {
    console.warn(`[tools-update] ${tool.slug}: Working-Tree nicht sauber – überspringe Pull.`);
    continue;
  }

  const current = git(repoPath, ['rev-parse', '--short', 'HEAD']).stdout.trim();
  console.log(`[tools-update] ${tool.slug}: Starte Update (aktuell ${current || 'unbekannt'})`);

  git(repoPath, ['fetch', '--prune'], { stdio: 'inherit' });

  const upstream = resolveUpstream(repoPath, tool);
  if (!upstream) {
    console.warn(`[tools-update] ${tool.slug}: Kein Upstream konfiguriert – Update übersprungen.`);
    continue;
  }

  try {
    git(repoPath, ['pull', '--ff-only', upstream.remote, upstream.branch], { stdio: 'inherit' });
  } catch (error) {
    console.error(`[tools-update] ${tool.slug}: Pull fehlgeschlagen (${error.message}).`);
    continue;
  }

  const updated = git(repoPath, ['rev-parse', '--short', 'HEAD']).stdout.trim();
  if (updated === current) {
    console.log(`[tools-update] ${tool.slug}: Keine neuen Commits.`);
  } else {
    console.log(`[tools-update] ${tool.slug}: Aktualisiert ${current} → ${updated}.`);
  }
}

function git(cwd, params, options = {}) {
  const result = spawnSync('git', params, { cwd, encoding: 'utf8', ...options });
  if (result.status !== 0) {
    throw new Error(`git ${params.join(' ')} (Exit ${result.status})`);
  }
  return result;
}

function isGitWorktree(cwd) {
  const result = spawnSync('git', ['rev-parse', '--is-inside-work-tree'], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return result.status === 0 && result.stdout.trim() === 'true';
}

function isWorktreeClean(cwd) {
  const status = spawnSync('git', ['status', '--porcelain'], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return status.status === 0 && status.stdout.trim().length === 0;
}

function resolveUpstream(cwd, tool) {
  if (tool.remote && tool.branch) {
    return { remote: tool.remote, branch: tool.branch };
  }
  const upstream = spawnSync('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (upstream.status !== 0) return null;
  const value = upstream.stdout.trim();
  if (!value.includes('/')) return null;
  const [remote, branch] = value.split('/', 2);
  return { remote, branch };
}
