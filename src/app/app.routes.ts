import { Routes } from '@angular/router';
// Games page now reuses the generic ToolsListComponent filtered by tag

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
    title: 'KUH LABS',
  },
  // Dedicated pages that filter tools by tag
  {
    path: 'jugger',
    loadComponent: () => import('./tools/tools-list/tools-list.component').then(m => m.ToolsListComponent),
    data: { tag: 'jugger', pageTitle: 'Jugger' },
    title: 'Jugger',
  },
  {
    path: 'tools',
    children: [
      {
        path: '',
        loadComponent: () => import('./tools/tools-list/tools-list.component').then(m => m.ToolsListComponent),
        data: { tag: 'tools', pageTitle: 'Tools' },
        title: 'Tools',
      },
      {
        path: 'tag/:tag',
        loadComponent: () => import('./tools/tools-list/tools-list.component').then(m => m.ToolsListComponent),
      },
      {
        path: ':slug',
        loadComponent: () => import('./tools/tool-embed/tool-embed.component').then(m => m.ToolEmbedComponent),
      },
    ],
  },
  {
    path: 'games',
    loadComponent: () => import('./tools/tools-list/tools-list.component').then(m => m.ToolsListComponent),
    data: { tag: 'games', pageTitle: 'Games' },
    title: 'Games',
  },
];
