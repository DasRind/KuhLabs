import { TOOL_COMMITS } from './tool-commits';
import type { ToolCommit } from './tool-commit.types';

export type ToolDefinition = {
  slug: string;
  title: string;
  description?: string;
  externalUrl?: string; // URL to load in iframe
  icon?: string; // optional icon path under /assets
  tags?: string[]; // categorization: e.g., ['jugger', 'tools']
  repoUrl?: string; // optional repository link
  lastCommits?: ToolCommit[]; // optional recent commit info
};

export const TOOLS: ToolDefinition[] = [
  {
    slug: 'randomizer',
    title: 'Jugger Randomized Lineup Generator',
    description:
      'Erzeugt zufällige Aufstellungen für Jugger-Teams – perfekt für Training und Spaß.',
    // Lokale Einbindung: wird aus public/embeds/randomizer/index.html geladen
    externalUrl: 'embeds/randomizer/index.html',
    tags: ['jugger', 'tools'],
<<<<<<< HEAD
    icon: 'assets/tools/randomizer/randomizerLogo.png',
=======
    icon: 'embeds/randomizer/img/basics/randomizerLogo.png',
>>>>>>> 8e37c9477a790c0e8b31acaab5f266b7dfefb721
    repoUrl: 'https://github.com/DasRind/KuhLabs',
    lastCommits: TOOL_COMMITS['randomizer'] ?? [],
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.slug === slug);
}



