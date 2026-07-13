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
    icon: 'assets/tools/randomizer/randomizerLogo.png',
    repoUrl: 'https://github.com/DasRind/KuhLabs',
    lastCommits: TOOL_COMMITS['randomizer'] ?? [],
  },
  {
    slug: 'tactics',
    title: 'Jugger Tactics Tool',
    description:
      'Plant Spielzüge und taktische Abläufe für Jugger-Teams direkt im Browser.',
    externalUrl: 'embeds/tactics/index.html',
    tags: ['jugger', 'tools'],
    repoUrl: 'https://github.com/DasRind/juggertools',
    lastCommits: TOOL_COMMITS['tactics'] ?? [],
  },
  {
    slug: 'swarm-demos',
    title: 'Swarm Demos',
    description:
      'Canvas-basierte Simulationen rund um Schwarmintelligenz und Robotik.',
    externalUrl: 'embeds/swarm-demos/index.html',
    tags: ['tools', 'games'],
    icon: 'assets/tools/swarm-demos/swarmDemos.png',
    repoUrl: 'https://github.com/DasRind/swarmDemos',
    lastCommits: TOOL_COMMITS['swarm-demos'] ?? [],
  },
  {
    slug: 'thomex',
    title: 'Thomex',
    description:
      'Interaktive Visualisierungen und Schritt-für-Schritt-Loesungen fuer Algorithmen und Optimierungsverfahren.',
    externalUrl: 'embeds/thomex/index.html',
    tags: ['tools'],
    icon: 'assets/tools/thomex/thomex-logo.png',
    repoUrl: 'https://github.com/DasRind/thomex',
    lastCommits: TOOL_COMMITS['thomex'] ?? [],
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
