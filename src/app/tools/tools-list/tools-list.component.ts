import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { TOOLS } from '../tools.data';

@Component({
  selector: 'kl-tools-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './tools-list.component.html',
  styleUrl: './tools-list.component.scss',
})
export class ToolsListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // current tag from route (e.g., 'jugger' | 'tools' | 'games')
  protected tag = signal<string | null>(null);

  protected tools = computed(() => {
    const t = this.tag()?.toLowerCase().trim() || null;
    if (!t) return TOOLS;
    return TOOLS.filter((tool) => (tool.tags || []).map((x) => x.toLowerCase()).includes(t));
  });

  protected pageTitle = signal<string>('Tools');
  protected title = computed(() => this.pageTitle());

  ngOnInit() {
    // react to route data (preferred) and param changes
    this.route.data.subscribe((d) => {
      const dataTag = (d['tag'] as string | undefined) ?? null;
      const dataTitle = (d['pageTitle'] as string | undefined) ?? undefined;
      if (dataTag) this.tag.set(dataTag);
      if (dataTitle) this.pageTitle.set(dataTitle);
    });
    this.route.paramMap.subscribe((pm) => {
      const t = pm.get('tag');
      if (t) {
        this.tag.set(t);
        // derive title for param-based route
        const map: Record<string, string> = { jugger: 'Jugger', tools: 'Tools', games: 'Games' };
        this.pageTitle.set(map[t.toLowerCase()] ?? t);
      }
    });
  }

  back() {
    // Go to home; adjust if a different target is desired
    this.router.navigateByUrl('/');
  }
}
