export type ToolDefinition = {
  slug: string;
  title: string;
  description?: string;
  externalUrl?: string; // URL to load in iframe
  icon?: string; // optional icon path under /assets
  tags?: string[]; // categorization: e.g., ['jugger', 'tools']
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
    icon: 'tools/randomizer/img/basics/randomizerLogo.png',
  },
];

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.slug === slug);
}
