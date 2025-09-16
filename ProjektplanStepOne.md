# Kuh Labs – Website MVP Blueprint & Starter Tasks

> Ziel: In 1–2 Wochen ein professionelles, performantes Dev Hub („Das Rind“) live bringen – mit sauberem Branding, GitHub‑Integration (Lesen), SEO/Legal und 1–2 Showcase‑Demos.

---

## 0) TL;DR – Was bauen wir genau?
- **Stack**: Angular 20+ (Standalone), SSR/SSG via Angular Universal, SCSS.
- **Core‑Features (MVP)**: Projektliste aus GitHub, Projekt‑Detail (README‑Render), Demos‑Sammlung, About, Contact, Legal (Impressum/Datenschutz), SEO‑Grundlagen.
- **Brand**: „Kuh Labs“ – techy + organische Akzente, Farben #a66a3f / #faf3e0 / #1f1711.
- **Hosting**: Vercel bevorzugt (SSR + Edge‑Funktionen). Alternative: Netlify (SSR), GitHub Pages (SSG only).
- **Qualität**: LCP < 2.5s, Home initial JS < 200 kB, A11y + Security (CSP, Sanitizing).

---

## 1) Meilensteine & Zeitplan
**Phase 0 – Setup (Tag 1–2)**
- Repo aufsetzen, Angular‑App, Theme/Branding, Basislayout.
- Angular Universal hinzufügen (SSR), Routing‑Skeleton.

**Phase 1 – MVP (Tag 3–7)**
- GitHub‑Listing & Detailseiten (mit README‑Render + Stars + letzte Commits).
- Demos‑Route mit 1–2 Einbettungen (iframe/Web‑Component).
- About, Contact, Impressum, Datenschutz.
- SEO (Meta, OG/Twitter Cards), robots.txt, sitemap.xml.

**Phase 2 – Feinschliff (Woche 2)**
- Filter & Suche, Release‑Widget, Loading‑Skeletons, Error‑States.
- Proxy/Edge‑Funktionen + Caching, Dark/Light‑Mode (Optional), PWA.
- Tests (Unit/e2e), Monitoring (optional), Consent‑Manager.

---

## 2) Projektstruktur (Monorepo)
```
apps/
  kuhlabs/
    src/
      app/
        core/            # ApiService, CacheService, AppConfig
        shared/          # UI Primitives (Badge, Chip, Skeleton, Pipes)
        features/
          home/
          projects/
            list/
            detail/
          demos/
          about/
          contact/
          legal/
        app.routes.ts
        app.config.ts
      assets/
      styles.scss
```

### Empfohlene NPM‑Pakete
- `@angular/platform-server` (SSR), `marked` (Markdown), `dompurify` (Sanitizing), `shiki` oder `prismjs` (Code Highlighting), `ngx-markdown` (optional), `@angular/service-worker` (PWA, optional).

---

## 3) Setup‑Befehle
```bash
# Neues Projekt (Standalone + Routing)
ng new kuhlabs --style=scss --routing --standalone
cd kuhlabs

# SSR hinzufügen
ng add @nguniversal/express-engine

# Markdown + Sanitizing + (optional) Highlighting
npm i marked dompurify prismjs
# oder: npm i shiki
```

---

## 4) Routing & Seiten
```ts
// app.routes.ts (Auszug)
export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component') },
  { path: 'projects', loadChildren: () => import('./features/projects/projects.routes') },
  { path: 'demos', loadComponent: () => import('./features/demos/demos.component') },
  { path: 'about', loadComponent: () => import('./features/about/about.component') },
  { path: 'contact', loadComponent: () => import('./features/contact/contact.component') },
  { path: 'legal', loadChildren: () => import('./features/legal/legal.routes') },
  { path: '**', redirectTo: '' }
];
```

### Sitemap
- `/` Home: Hero, Top‑Tools, letzte Releases, Spotlight‑Projekt, Support/Spenden.
- `/projects` Liste (Filter/Sort),
- `/projects/:slug` Detail,
- `/demos` Demos‑Sammlung,
- `/about`, `/contact`, `/legal` (Impressum, Datenschutz).

---

## 5) GitHub‑Integration
### Architektur
- **Variante A (MVP)**: Client ruft GitHub API direkt → schnell, aber Rate‑Limits.
- **Variante B (empfohlen)**: Server/Edge‑Proxy mit PAT (höhere Limits), Response Cache (TTL 15–60min), optional Webhooks für Cache‑Invalidierung.

### API‑Contracts (TS Interfaces)
```ts
export interface Repo {
  id: number; name: string; full_name: string; description?: string;
  html_url: string; homepage?: string; topics?: string[];
  stargazers_count: number; pushed_at: string; updated_at: string;
  language?: string; fork: boolean;
}

export interface Release {
  id: number; tag_name: string; html_url: string; name?: string; created_at: string;
}
```

### ApiService (Auszug)
```ts
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/github'; // per Proxy geroutet

  getUserRepos(user: string) {
    return this.http.get<Repo[]>(`${this.base}/users/${user}/repos?sort=updated&per_page=100`);
  }
  getRepo(owner: string, repo: string) {
    return this.http.get<Repo>(`${this.base}/repos/${owner}/${repo}`);
  }
  getReadme(owner: string, repo: string) {
    return this.http.get(`${this.base}/repos/${owner}/${repo}/readme`, { responseType: 'text' });
  }
  getReleases(owner: string, repo: string) {
    return this.http.get<Release[]>(`${this.base}/repos/${owner}/${repo}/releases`);
  }
}
```

### Cache‑Strategie
- **Client**: Stale‑While‑Revalidate (in‑Memory Map mit TTL ~15min).
- **Server/Edge**: Key‑Value Cache (TTL 30–60min), Header `Cache-Control` korrekt setzen.

---

## 6) README‑Rendering sicher umsetzen
```ts
// readme-renderer.util.ts
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export function renderReadme(md: string): string {
  const raw = marked.parse(md, { mangle: false, headerIds: true });
  return DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
}
```

```html
<!-- readme.component.html -->
<div [innerHTML]="sanitizedHtml"></div>
```

---

## 7) UI‑Komponenten (Auszug)
- `ProjectCard` (Name, Topics, Stars, Updated‑Zeit)
- `ProjectFilterBar` (Suche, Sortierung, Topic‑Chips)
- `ReadmeRenderer` (Markdown + Code‑Highlighting)
- `DemoFrame` (iframe/Web‑Component, sandbox: allow‑scripts same‑origin)
- `ReleaseTimeline`, `CommitList`, `TagChips`, `Badge`, `EmptyState`, `SkeletonLoader`

**Design Tokens**
```scss
:root {
  --cl-brown: #a66a3f;
  --cl-cream: #faf3e0;
  --cl-dark:  #1f1711;
}
```

---

## 8) Branding Assets
### Logo (SVG – Konzept „Reagenzglas mit Kuhkopf“)
```svg
<svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kuh Labs Logo">
  <defs>
    <clipPath id="cowHead">
      <path d="M90 50c-18 0-30 14-30 30 0 18 14 30 30 30s30-12 30-30c0-16-12-30-30-30z"/>
    </clipPath>
  </defs>
  <rect width="180" height="180" fill="#faf3e0"/>
  <g transform="translate(40,15)">
    <rect x="30" y="0" width="40" height="120" rx="8" fill="#a66a3f"/>
    <rect x="26" y="115" width="48" height="18" rx="9" fill="#1f1711"/>
    <g clip-path="url(#cowHead)">
      <circle cx="50" cy="70" r="24" fill="#1f1711"/>
      <circle cx="44" cy="66" r="6" fill="#faf3e0"/>
      <circle cx="56" cy="66" r="6" fill="#faf3e0"/>
    </g>
  </g>
  <text x="90" y="165" text-anchor="middle" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco" font-size="16" fill="#1f1711">Kuh Labs</text>
</svg>
```

---

## 9) SEO & Social
- Saubere Routen, sprechende Slugs.
- `Meta`‑Service für Title/Description je Route, OG/Twitter Cards.
- `sitemap.xml` via Build‑Script generieren (liest `app.routes.ts`).
- `robots.txt` (Allow: /, Disallow: /api/).
- Structured Data (JSON‑LD `WebSite`, `Person`, `SoftwareSourceCode`).

**Meta‑Service (Auszug)**
```ts
@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(private meta: Meta, private title: Title) {}
  set(opts: { title: string; description?: string; image?: string; path?: string }) {
    this.title.setTitle(opts.title);
    this.meta.updateTag({ name: 'description', content: opts.description ?? '' });
    this.meta.updateTag({ property: 'og:title', content: opts.title });
    if (opts.description) this.meta.updateTag({ property: 'og:description', content: opts.description });
    if (opts.image) this.meta.updateTag({ property: 'og:image', content: opts.image });
    if (opts.path) this.meta.updateTag({ property: 'og:url', content: 'https://kuh.labs' + opts.path });
  }
}
```

---

## 10) Security, Privacy & Legal (DE)
- **Impressum** und **Datenschutzerklärung** (DSGVO, IP‑Anonymisierung, Log‑Daten, Cookies/Consent).
- **CSP** (mind. `default-src 'self'`; für GitHub‑Raw/Images gezielt whitelisten), `X-Frame-Options`, `Referrer-Policy`.
- Markdown‑Sanitizing (DOMPurify), nur erlaubte iframe‑Domains (Demos).
- Consent‑Manager (Matomo optional) → erst nach Opt‑In tracken.

**Vercel/Netlify Header (Beispiel)**
```
Content-Security-Policy: default-src 'self'; img-src 'self' https: data:; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-src https://*; connect-src 'self' https://api.github.com;
Referrer-Policy: no-referrer-when-downgrade
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## 11) Performance & Qualität
- Budgets: Home < 200 kB JS initial, LCP < 2.5 s.
- Lazy‑Loading je Route, Image‑Optimierung (AVIF/WebP), Preconnect zu GitHub.
- Accessibility: Kontraste, Fokus‑Styles, ARIA Landmarks, Skip‑Links.
- Testing: Jest/Karma (Unit), Playwright (e2e), Lint/Prettier.

---

## 12) CI/CD & Hosting
- **GitHub Actions**: Lint → Test → Build → Preview Deploy (PRs).
- **Deploy**: `main` → Production; PR → Preview URLs.
- **Environment Vars**: `GITHUB_TOKEN` (PAT, read‑only), `CACHE_TTL_MINUTES`.

**.github/workflows/ci.yml (Skizze)**
```yml
name: CI
on:
  push: { branches: [ main ] }
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --watch=false --browsers=ChromeHeadless
      - run: npm run build:ssr
      - uses: actions/upload-artifact@v4
        with: { name: dist, path: dist/ }
```

---

## 13) Seiten‑Checklisten
### Home
- Hero (Claim + CTA „Zu den Projekten“), Spotlight‑Projekt, Letzte Releases, Logos/Tech‑Stack, Footer mit Socials.

### Projects/List
- Suche, Sortierung (Updated, Stars), Topic‑Filter, Paginierung/Infinite.

### Projects/Detail
- README‑Render, Links (GitHub, Demo), Stars, Letzte Commits, Releases‑Timeline, Topics.

### Demos
- Grid mit iframe‑Karten (Sandbox: `allow-scripts allow-same-origin`).

### About / Contact
- Kurzvita, Skills, Foto/Avatar, Kontaktformular (mit Bot‑Schutz, z.B. hCaptcha/Turnstile), Social Links.

### Legal
- Vollständiges Impressum (Adresse, Kontakt, Vertretungsberechtigter), DSGVO‑Abschnitte (Zwecke, Rechtsgrundlagen, Empfänger, Speicherdauer, Betroffenenrechte, Drittlandtransfer, Auftragsverarbeiter, Beschwerderecht, Cookies, Logs).

---

## 14) Backlog – User Stories (Auszug)
- Als Besucher möchte ich Projekte sehen und **filtern**.
- Als Besucher möchte ich **README** direkt lesen.
- Als Besucher möchte ich eine **Demo** testen.
- Als Maintainer möchte ich neue Projekte **leicht hinzufügen**.

**Akzeptanzkriterien**: Ladezustand (Skeleton), Fehlerzustand (Retry), A11y‑Audit Pass.

---

## 15) To‑Do – Nächste konkrete Schritte
1) **Brand fixieren** (Logo‑SVG ins Repo, Favicon/OG Image generieren)
2) **Angular‑Repo erstellen** + Universal + Routen + Theme Tokens
3) **ApiService + Proxy** (Edge/Express) + Cache implementieren
4) `ProjectCard`, `ProjectList`, `ProjectDetail` + README‑Renderer
5) **Demos**: 1–2 Showcase‑Demos einbetten
6) **SEO**: Meta‑Service, sitemap.xml, robots.txt, JSON‑LD
7) **Legal**: Impressum/Datenschutz Inhalte erstellen
8) **CI/CD**: GitHub Actions + Vercel Projekt verbinden

---

## 16) Offene Punkte (bitte entscheiden)
- GitHub **Username/Organisation** für die API‑Abfragen?
- **Hosting**: Vercel (empfohlen) vs. Netlify vs. GitHub Pages?
- **Erste Demos**: Welche 1–2 Projekte sollen auf die Home?
- **Analytics**: Matomo ja/nein? (Consent‑Manager Aufwand)
- **Dark Mode** fürs MVP oder später?

---

## 17) Anhänge
- **404‑Copy Idee**: „Diese Weide ist leer. Zurück zur Herde?“
- **Button‑Copy**: „Jetzt ausmisten“ (Clear Filter), „Zur Weide“ (Home), „Muuuh‑ment!“ (Loading‑Easter‑Egg)

