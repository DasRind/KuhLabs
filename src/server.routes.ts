import { PrerenderFallback, RenderMode, type ServerRoute } from '@angular/ssr';
import { TOOLS } from './app/tools/tools.data';

const tagParams = Array.from(
  new Set(
    TOOLS.flatMap((tool) => tool.tags ?? [])
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
  )
);

export const SERVER_ROUTES: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'jugger', renderMode: RenderMode.Prerender },
  { path: 'tools', renderMode: RenderMode.Prerender },
  {
    path: 'tools/tag/:tag',
    renderMode: RenderMode.Prerender,
    fallback: PrerenderFallback.Server,
    async getPrerenderParams() {
      return tagParams.map((tag) => ({ tag }));
    },
  },
  {
    path: 'tools/:slug',
    renderMode: RenderMode.Server,
  },
  { path: 'games', renderMode: RenderMode.Prerender },
  { path: '**', renderMode: RenderMode.Server },
];
