# Projektplan – „Das Rind“ Dev Hub (Kuh Labs)

> Zentrale Plattform für alle Implementierungen, Tools und Demos von „Das Rind“. Fokus: klare Entwickler-Brand, spielerisches Kuh-Theme, GitHub-Integration, modulare Erweiterbarkeit.

---

## 1) Branding & Name

### Namensrichtungen

- **Kuh Labs**

### Domain-/Brand-Notizen

- Visuelle Sprache: Monospace/Tech-Fonts + organische Akzente (Flecken/„Cow-Pattern“).
- Farben: Hellbraun `#a66a3f`, Cremeweiß `#faf3e0`, Dunkelbraun `#1f1711`.
- Logovorschläge: Reagenzglas mit Kuhkopf-Silhouette.

---

## 2) Zielbild & Nutzen

- **Zentrale Sammlung** aller Projekte mit direkter Nutzbarkeit (Demos/Spielwiesen).
- **GitHub-Integration** (Repos, Issues, Releases, README) möglichst automatisch.
- **Skalierbar**: Neue Tools/Projekte lassen sich ohne großen Aufwand hinzufügen.
- **Persönliche Marke** sichtbar (About, Tech-Stack, Blog, Roadmaps).

---

## 3) Informationsarchitektur (Sitemap)

- `/` (Home): Hero, Schnellzugriffe auf Top-Tools, letzte Releases, Spotlight-Projekt, Spendenlink.
- `/projects`: Filterbare Liste aller Repos.
- `/projects/:slug`: Projekt-Detail (README, Releases, Issues, Demo-Link).
- `/demos`: Sammlung interaktiver Demos.
- `/about`: Kurzvita, Skills, Tech-Setup, Talks.
- `/contact`: Links, Formular.
- `/legal`: Impressum, Datenschutz.

---

## 4) Funktionsliste

### MVP (Phase 1)

- Design und Struktur der Website
- Projekt-Detailseiten mit README-Render, Stars, letzte Commits.
- Basis-Branding: Logo, Theme, SEO.
- Impressum & Datenschutz.

### Nice-to-have (Phase 2+)

- Repo-Listing via API (user repos, pinned, tags).
- Demos per iframe/Web Component.
- Release-Feed/Changelogs.
- Suche, Filter, Tags.
- Contribution-Graph, Feedback-Funktion.
- Dark/Light-Mode, PWA, Monitoring.

---

## 5) Technische Architektur

### Frontend

- **Angular 20+** mit Standalone Components, Signals, Router.
- **State**: Signal-basiert, optional Cache-Service.
- **Styling**: SCSS, zentrale `styles.scss`.
- **SSR/SSG**: Angular Universal.
- **i18n**: DE primär, EN vorbereitet.

### Backend (optional)

- **Edge-Funktionen** oder Node/Express-Proxy für GitHub API.
- Serverseitiger Cache (TTL 10–60 min).

### GitHub-Integration

1. Direkte API vom Client (Rate Limits).
2. Server-Proxy mit PAT (höhere Limits).
3. Webhooks für Cache-Invalidierung.

### Einbindung externer Projekte

- Einbindung beim Build → Tools bleiben auf GitHub, sparen Kosten.

---

## 6) Sicherheits-, Rechts- & Datenschutz-Aspekte

- Impressum und Datenschutzerklärung (DSGVO).
- Consent für Analytics (Matomo optional).
- CSP, XSS/Clickjacking-Schutz.
- Logs minimieren, IP-Anonymisierung.

---

## 7) Performance & Qualität

- Budgets: Home < 200 KB JS initial, LCP < 2.5 s.
- Lazy Loading pro Route.
- Image Optimization (AVIF/WebP).
- Accessibility (Kontraste, ARIA).
- Testing (Unit, e2e, Lint, Prettier, CI).

---

## 8) SEO & Social

- Saubere Routen, sprechende Slugs.
- Meta, OpenGraph/Twitter Cards.
- Sitemap.xml, robots.txt.
- Strukturdaten (JSON‑LD).

---

## 9) CI/CD & Hosting

- Monorepo (App + Content + Infra).
- CI: Lint, Test, Build, Preview Deployments.
- Hosting: Vercel/Netlify (SSR) oder GitHub Pages (SSG).
- Deploy: Main → prod; PR → preview.

---

## 10) Angular Projektstruktur

```
apps/
  kuhlabs/
    src/
      app/
        core/            # Services (Api, Cache, Config)
        shared/          # UI primitives, Pipes, Directives
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

---

## 11) Datenflüsse & API-Contracts

### GitHub API Endpunkte (Beispiele)

- `GET /users/:user/repos` – Liste Projekte
- `GET /repos/:owner/:repo` – Metadaten
- `GET /repos/:owner/:repo/readme` – README
- `GET /repos/:owner/:repo/releases` – Releases
- `GET /repos/:owner/:repo/commits` – letzte Commits

### Cache-Strategie

- Client: Stale‑While‑Revalidate (TTL 15 min).
- Server: KV/Filesystem Cache (TTL 30–60 min).

---

## 12) Komponenten (Auszug)

- `ProjectCard` (Name, Topics, Stars, Update‑Zeit)
- `ProjectFilterBar`
- `ReadmeRenderer` (Markdown + Code Highlighting)
- `DemoFrame` (iframe/Component Loader)
- `ReleaseTimeline`
- `CommitList`
- `TagChips`, `Badge`, `EmptyState`, `SkeletonLoader`

---

## 13) Inhalte & Tonalität

- Kurze Teasertexte, klare CTAs.
- Humorvolle Microcopy mit Kuh‑Bezug (z. B. 404 „Diese Weide ist leer“).

---

## 14) Roadmap

### Phase 0 – Setup (1–2 Tage)

- Branding finalisieren, Logo.
- Angular-Repo, Base-Layout, Theme.

### Phase 1 – MVP (3–7 Tage)

- GitHub-Listing & Detailseiten.
- 1–2 Demos eingebunden.
- SSR aktivieren, SEO, Legal-Seiten.

### Phase 2 – Veredelung (1–2 Wochen)

- Filter, Suche, Release-Widgets.
- Proxy/Webhooks, PWA, Dark/Light-Mode.
- Testing/Monitoring.

### Phase 3 – Langfristig

- Microfrontends für Sub‑Apps.
- Blog, Feedbacksystem, Analytics.

---

## 15) Backlog – User Stories (Auszug)

- **Als Besucher** möchte ich Projekte sehen und filtern.
- **Als Besucher** möchte ich README lesen.
- **Als Besucher** möchte ich eine Demo testen.
- **Als Maintainer** möchte ich neue Projekte leicht hinzufügen.

---

## 16) Risiken & Gegenmaßnahmen

- **Rate Limits** → Proxy/Cache.
- **SEO/Indexierung** → Meta/OG Tags.
- **Security** → CSP, Markdown-Sanitizing.

---

## 17) Nächste konkrete Schritte

1. Namen & Logo festlegen ✅
2. Angular Repo + Theme ✅
3. GitHub API Service + Projektliste
4. Detailroute + README-Render
5. Erste Demo einbinden
6. Impressum/Datenschutz schreiben

---

## 18) Beispielhafte Tech-Snippets

**GitHub Service**

```ts
getUserRepos(user: string) {
  return this.http.get<Repo[]>(`/api/github/users/${user}/repos?sort=updated&per_page=100`);
}
```

**Demo-Einbindung**

```html
<iframe [src]="trustedUrl" sandbox="allow-scripts allow-same-origin" loading="lazy" class="w-full h-[70vh] rounded-xl border"></iframe>
```

**Markdown‑Render Sicherheit**

- Markdown → HTML mit DOMPurify.
- Code Highlighting (Shiki/Prism).

---

## 19) Offene Entscheidungen

- Finaler Name + Domain ✅
- Hosting (Vercel vs. Netlify vs. GitHub Pages)
- Analytics ja/nein
- Welche Projekte/Demos zuerst?

---
