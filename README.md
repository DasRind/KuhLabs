# KuhLabs

Zentraler Hub für Tools, Demos und Projekte (Angular 20, SSR/SSG).

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Tools einbinden (Submodule)

Tools (z. B. der Jugger Randomizer) werden als Git‑Submodule unter `external/tools/<slug>` eingebunden und beim Build/Start in `public/embeds/<slug>` synchronisiert. Die App lädt sie dann per iframe unter `/tools/<slug>`.

- Aktuell eingebundene Slugs:
  - `randomizer` – Jugger Lineup Generator (Nx-Workspace `juggertools`, Build: `dist/lineup-randomizer/browser`)
  - `swarm-demos` – Canvas-Demos zur Schwarmintelligenz (Angular, Build: `dist/swarmDemos/browser`)

- Routes: `src/app/app.routes.ts` (`/tools`, `/tools/:slug`)
- Tools-Liste: `src/app/tools/tools-list.component.ts`
- Tool-Embed: `src/app/tools/tool-embed.component.ts`
- Tool-Konfiguration: `src/app/tools/tools.data.ts`

### Setup

- Das Jugger Lineup Randomizer Tool lebt jetzt im Monorepo [juggertools](https://github.com/DasRind/juggertools) (Projekt `lineup-randomizer`).
- Binde es als Submodule ein (SSH empfohlen, damit vorhandene Zertifikate greifen):
  ```bash
  git submodule add git@github.com:DasRind/juggertools.git external/tools/randomizer
  git submodule update --init --recursive
  git -C external/tools/randomizer checkout main
  ```
- Danach im Submodule einmalig Dependencies installieren (`cd external/tools/randomizer && npm ci`).

Falls ein anderes Tool ein separates Repo nutzt, leg es ebenfalls unter `external/tools/<slug>` als Submodule an.

### Build & Sync

- `npm run tools:build` – baut alle konfigurierten Tools; der Randomizer nutzt `npx nx run lineup-randomizer:build:production` (Fallback: `npm run build`).
- `npm run tools:sync` – kopiert inkrementell aus dem jeweiligen Build‑Output (z. B. `external/tools/randomizer/dist/lineup-randomizer/browser`) nach `public/embeds/<slug>`.
- `npm run tools:prepare` – führt Build und Sync nacheinander aus.
- `npm run tools:update` – zieht neue Commits in allen Submodules (`git submodule update --remote --merge --recursive`).
- `npm run tools:refresh` – Update + Prepare in einem Rutsch.

#### Swarm Demos (`swarm-demos`)

- Lives im Submodule `external/tools/swarm-demos` (Angular 20).
- Standard-Build via `npm run build` → Output `dist/swarmDemos/browser`.
- Sync landet in `public/embeds/swarm-demos`, Route `/tools/swarm-demos`.
- Für lokale Anpassungen: `cd external/tools/swarm-demos && ng serve` für Live-Vorschau; anschließend `npm run tools:prepare`.

### Was sind .mjs Dateien?

- `.mjs` ist die Dateiendung für ES‑Module in Node.js (import/export Syntax).
- Vorteil hier: Die Skripte `scripts/tools-build.mjs` und `scripts/tools-sync.mjs` können moderne `import`‑Statements verwenden, ohne dass das gesamte Projekt auf ESM (`"type": "module"`) umgestellt werden muss.

### Skripte im Detail

- `scripts/tools-build.mjs`
  - Baut konfigurierte Repositories (z. B. Submodules unter `external/tools/<slug>`).
  - Führt bei fehlendem `node_modules` automatisch `npm ci` aus.
  - Lässt reine HTML/Static‑Repos unangetastet (kein Build nötig).

- `scripts/tools-sync.mjs`
  - Sucht im konfigurierten Build‑Output (z. B. `external/tools/randomizer/dist/lineup-randomizer/browser`) nach einem fertigen `index.html`.
  - Überspringt Dev‑Indizes (Vite/Webpack/HMR/localhost), um Reload‑Loops zu verhindern.
  - Kopiert nach `public/embeds/<slug>` und speichert den zugehörigen Commit in `.tools-sync/<slug>.rev`.
  - Inkrementell: Kopiert nur bei geändertem Commit; per `FORCE=1` lässt sich Kopie erzwingen.

### Typischer Workflow

1) Externes Tool anbinden
   ```bash
   git submodule add <repo-url> external/tools/<slug>
   git submodule update --init --recursive
   ```

2) Bauen & Kopieren
```bash
npm run tools:prepare
```

3) Starten
```bash
ng serve
# http://localhost:4200/tools/<slug>
```

4) Updates aus Submodules einziehen
```bash
npm run tools:refresh
```

### Troubleshooting

- 404 unter `/embeds/<slug>/index.html`:
  - `npm run tools:sync` erneut ausführen und Dev‑Server neu starten.
  - Prüfen, ob der Build Output wirklich eine `index.html` beinhaltet (z. B. `dist/<name>/browser/index.html`).

- Tool lädt im iframe ständig neu:
  - Stellen sicher, dass ein Production‑Build synchronisiert wurde (kein Dev‑Index). Das Sync‑Skript filtert Dev‑Indizes, prüfe ggf. die Build‑Konfiguration.

Der Sync ist inkrementell und kopiert nur, wenn sich der Submodule‑Commit geändert hat (Status wird in `.tools-sync/<slug>.rev` abgelegt). Erzwingen per `FORCE=1 npm run tools:sync`.

### Lokaler Start

```bash
npm run tools:prepare
ng serve
```

Öffne `http://localhost:4200/tools` und wähle ein Tool aus.

### Weiteres Tool hinzufügen

1) Submodule hinzufügen nach `external/tools/<slug>`
2) In `src/app/tools/tools.data.ts` neuen Eintrag anlegen (`slug`, `title`, `description`, `externalUrl: '/embeds/<slug>/index.html'`).
3) `npm run tools:prepare` ausführen.

Hinweis: Assets liegen bewusst unter `/embeds/<slug>`, um Kollisionen mit Angular‑Routen wie `/tools/:slug` zu vermeiden (dev‑Server könnte sonst Directory‑Index ausliefern).

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
