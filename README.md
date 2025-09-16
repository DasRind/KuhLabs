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

- Routes: `src/app/app.routes.ts` (`/tools`, `/tools/:slug`)
- Tools-Liste: `src/app/tools/tools-list.component.ts`
- Tool-Embed: `src/app/tools/tool-embed.component.ts`
- Tool-Konfiguration: `src/app/tools/tools.data.ts`

### Setup

Im Repo ausführen:

```bash
git submodule add https://github.com/DasRind/JuggerRandomizedLineupGenerator.git external/tools/randomizer
git submodule update --init --recursive
```

Falls das Tool einen Build benötigt, erzeugt das Submodule typischerweise `docs/`, `dist/` oder `build/`.

### Build & Sync

- `npm run tools:build` – baut alle Submodule, wenn `package.json#scripts.build` vorhanden ist.
- `npm run tools:sync` – kopiert inkrementell aus `external/tools/<slug>/{docs|dist|build|.}` nach `public/embeds/<slug>`.
- `npm run tools:prepare` – führt Build und Sync nacheinander aus.
- `npm run tools:update` – zieht neue Commits in allen Submodules (`git submodule update --remote --merge --recursive`).
- `npm run tools:refresh` – Update + Prepare in einem Rutsch.

### Was sind .mjs Dateien?

- `.mjs` ist die Dateiendung für ES‑Module in Node.js (import/export Syntax).
- Vorteil hier: Die Skripte `scripts/tools-build.mjs` und `scripts/tools-sync.mjs` können moderne `import`‑Statements verwenden, ohne dass das gesamte Projekt auf ESM (`"type": "module"`) umgestellt werden muss.

### Skripte im Detail

- `scripts/tools-build.mjs`
  - Baut Submodules, wenn ein `package.json` mit `scripts.build` vorhanden ist.
  - Führt bei fehlendem `node_modules` automatisch `npm ci` aus.
  - Lässt reine HTML/Static‑Repos unangetastet (kein Build nötig).

- `scripts/tools-sync.mjs`
  - Sucht in `external/tools/<slug>` nach fertigen Build‑Ordnern (`docs`, `dist`, `build`).
  - Findet `index.html` bis zu zwei Ebenen tief (z. B. `dist/<name>/browser/`).
  - Überspringt Dev‑Indizes (Vite/Webpack/HMR/localhost), um Reload‑Loops zu verhindern.
  - Kopiert nach `public/embeds/<slug>` und speichert den Submodule‑Commit in `.tools-sync/<slug>.rev`.
  - Inkrementell: Kopiert nur bei geändertem Commit; per `FORCE=1` lässt sich Kopie erzwingen.

### Typischer Workflow

1) Submodule anlegen (einmalig)
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
