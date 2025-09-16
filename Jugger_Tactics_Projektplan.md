# Jugger Tactics — Projektplan (MVP → v1)

\*Stand: 15.09.2025 — Autor: Das Rind

---

## 1) Kurzfassung (Executive Summary)

Wir bauen ein **leichtgewichtiges, 2D-Top‑Down Taktik‑Tool für Jugger** als **Angular**-App.
Im MVP enthält es:

- ein **Jugger-Feld** mit **90°-Drehknopf** (Portrait/Landscape),
- **Team-Panels** links & rechts mit **Playercards** (Drag & Drop aufs Feld),
- eine **Toolbox** (rechts) mit **Stift**, **Pfeil**, **Hütchen/Kegel**, **Auswahl/Löschen**,
- einen **Export-Button**, der **Feld + Panels als Screenshot** liefert (PNG).

Kein externer Zeichen-Engine-Dependency; die Rendering-Engine basiert auf **Canvas 2D + Pointer Events** (eigene Implementierung, kommerziell nutzbar). PDF, GIF/Video-Export und weiterführende Analytics kommen nach dem MVP in späteren Phasen.

---

## 2) Ziele & Nicht‑Ziele

### 2.1 Ziele (MVP)

- **Schnell skizzieren:** Tokens platzieren, einfache Markierungen, Pfeile, Hütchen.
- **Intuitiv:** Drag & Drop von Playercards auf das Feld; Rotation mit einem Klick.
- **Teilbar:** Ein Klick → **PNG‑Screenshot** (Feld + Teamleisten).
- **Wiederverwendbar:** Architektur so, dass Komponenten in weiteren Projekten genutzt werden können.

### 2.2 Nicht‑Ziele (MVP)

- Kein komplexes **PDF‑Editing** (kommt später).
- Keine **Zeitleisten‑Animationen** oder MP4/WebM‑Export (später).
- Kein generischer „PDF‑Editor“ (Formulare, Rich‑Media, OCR – später).

---

## 3) Nutzer & Use Cases

- **Coach/Captain**: taktische Skizze vor Training/Spiel; teilt Screenshot im Teamchat.
- **Teammitglied**: versteht geplante Laufwege/Positionen auf einen Blick.
- **Analyse** (später): baut ein Taktik‑„Playbook“, sammelt Presets, vergleicht Varianten.

Verwandtes, zweites Projekt (Analytics/Recorder): zwei Teams links/rechts, Jugger‑Feld in der Mitte, **„Neuer Zug“**, Spielerauswahl je Team, **Spieler animiert in die Mitte**, Ergebnis **Duell gewonnen/verloren/Doppel**, **„Spielende“**, jeden Zug als **JSON** speichern (inkl. Turnier, Positionen) und später auswerten. fileciteturn1file0

---

## 4) Funktionsumfang MVP

### 4.1 Feld & Rotation

- Jugger‑Spielfeld (Top‑Down), Maße parametrisierbar.
- **90°‑Drehknopf**: Portrait ↔ Landscape (Daten bleiben in Feldkoordinaten; nur View rotiert).

### 4.2 Team‑Panels & Playercards

- **Links & rechts** je ein Panel pro Team (Name, Farbe, optional Logo/Avatar).
- Playercards (Name, Nummer, Rolle) via **Drag & Drop** aufs Feld → Token entsteht.

### 4.3 Toolbox (rechts)

- **Select** (auswählen/verschieben)
- **Pen** (Freihand‑Pfad)
- **Arrow** (Start → Ziel, Pfeilspitze)
- **Cone/Hütchen** (Marker mit Radius)
- **Erase** (Objekte löschen)
- Farb-/Strichstärke‑Optionen (einfach).

### 4.4 Export

- **Screenshot (PNG)**: _Feld + beide Team‑Panels_ als ein Bild.
- Umsetzung per **eigener Canvas‑Komposition** (kein html2canvas nötig).

---

## 5) Architektur (High‑Level)

Wir verfolgen „Zero‑deps Core“: **keine externe Zeichen‑Engine**, stattdessen eine **eigene Canvas‑Engine** + dünne Angular‑Wrapper.

```
apps/
  tactics/                 # App 1: Jugger Tactics (MVP)
  analytics/               # App 2: Recorder/Analytics (später)
libs/
  core-domain/             # Modelle (Field, Team, Player, Token, Drawing, Scene)
  core-geometry/           # Koordinaten, 90°-Rotation, Transform, Hit-Tests
  core-engine/             # Canvas-Renderer + Scene-Graph + Input (Pointer)
  ui-angular/              # Angular-Komponenten (FieldCanvas, Toolbox, TeamPanel)
  tools-draw/              # Pen/Arrow/Cone/Select/Erase als Tool-Plugins
  export-screenshot/       # Eigene Offscreen-Canvas-Komposition (PNG)
```

> **Entwicklung**: Monorepo (Nx) mit _publishable_ Libraries.  
> **Veröffentlichung**: Jede Lib als **eigenes npm‑Paket** (SemVer, peerDependencies für Angular).  
> So kann das „Jugger Fieldtool“ in beliebigen Repos genutzt werden (auch kommerziell).

---

## 6) Technisches Design

### 6.1 Datenmodell (Kern)

```ts
export interface FieldSpec {
  width: number; // z. B. 40 (m) oder normiert 1.0
  height: number; // z. B. 20 (m) oder normiert 0.5
  lines?: { kind: "center" | "zone" | "mark"; x1: number; y1: number; x2: number; y2: number }[];
}

export type Orientation = "landscape" | "portrait";

export interface Team {
  id: string;
  name: string;
  color: string;
  logoUrl?: string;
  players: Player[];
}

export interface Player {
  id: string;
  name: string;
  role?: "Läufer" | "Kette" | "Kurz" | "Lang" | "Schild" | "Stab" | string;
  number?: string;
  avatarUrl?: string;
}

export interface Token {
  id: string;
  teamId: string;
  playerId?: string;
  x: number;
  y: number; // Feldkoordinaten
  rotation?: number; // Grad
  label?: string;
}

export type Drawing = { id: string; kind: "pen"; points: { x: number; y: number }[]; stroke: string; width: number } | { id: string; kind: "arrow"; from: { x: number; y: number }; to: { x: number; y: number }; stroke: string; width: number } | { id: string; kind: "cone"; at: { x: number; y: number }; radius: number; fill: string };

export interface Scene {
  id: string;
  field: FieldSpec;
  orientation: Orientation;
  tokens: Token[];
  drawings: Drawing[];
  leftTeamId: string;
  rightTeamId: string;
}
```

**Einheit**: Feldkoordinaten in **logischer Einheit** (Meter oder normiert 0..1).  
**Rotation** ist **reine View‑Transform**; Daten bleiben stabil für Export/Analytics.

### 6.2 Rendering‑Engine (Canvas 2D)

- **Stage**: verwaltet Canvas, Layers (`background`, `drawings`, `tokens`, `overlay`), DpR‑Skalierung.
- **Transform**: berechnet Matrix `M` (Field→Screen) inkl. 90°‑Rotation + Scale + Translation.
- **Inverse**: `M⁻¹` für Input‑Mapping (Screen→Field).
- **Zeichnen**:
  - Hintergrund (Feld‑Linien) ggf. **vorgezeichnet** und gecacht.
  - Drawings (Pfad/Pfeil/Hütchen) in Feldkoordinaten → via `M` auf Screen.
  - Tokens als Kreise/Icons/Text (später: Avatare via `drawImage`).

### 6.3 Input & Tools

- **Pointer Events** (`pointerdown/move/up/cancel`) → an aktives **Tool** delegieren.
- **Tool‑Interface**:

```ts
export interface Tool {
  kind: "select" | "pen" | "arrow" | "cone" | "erase";
  onPointerDown(pt: { x: number; y: number }, scene: Scene, engine: Engine): void;
  onPointerMove(pt: { x: number; y: number }, scene: Scene, engine: Engine): void;
  onPointerUp(pt: { x: number; y: number }, scene: Scene, engine: Engine): void;
  drawOverlay?(ctx: CanvasRenderingContext2D, scene: Scene): void;
}
```

- **Pen** sammelt Punkte, **Arrow** Start→Ende, **Cone** setzt Marker, **Select/Erase** nutzen Hit‑Tests.
- **Hit‑Testing**: erst bounding box, dann präziser Test (Punkt‑zu‑Linie‑Distanz bzw. Kreiskollision).

### 6.4 Angular‑Wrapper

- `<jugger-field [scene] [tool] (sceneChange)>`
- `<jugger-team-panel [team] side="left|right" (dropPlayer)="..." />`
- `<jugger-toolbox (toolChange)>` / `<jugger-rotate-button (toggle)>`

Die Wrapper initialisieren die Engine, verbinden State/Inputs und halten die API stabil für Wiederverwendung.

### 6.5 Export (PNG) — Eigene Komposition

Wir rendern **alles** (Panels + Feld) kontrolliert in **eine Offscreen‑Canvas**:

1. Linkes **Team‑Panel** (Name, Farbe, Players als kleine Cards).
2. **Feldbereich** mit Hintergrund, Drawings, Tokens.
3. Rechtes **Team‑Panel**.
4. `convertToBlob('image/png')` → Download.

Vorteile: gleiche Optik wie on‑screen, **CORS‑sicher**, kein html2canvas nötig.

---

## 7) Wiederverwendung im Analytics/Recorder‑Tool

Das zweite Projekt teilt Layout & Modelle (Panels/Feld/Interaktionen). Die Engine & UI‑Wrapper werden **1:1** verwendet.
Spezifische Funktionen aus den Notizen: **„Neuer Zug“, Spieler in die Mitte, Duell‑Ergebnis setzen, Spielende, jeden Zug als JSON speichern (inkl. Position/Aufstellung/Turnier)** – werden auf derselben Scene‑Struktur und Export/Serializer aufgebaut. fileciteturn1file0

---

## 8) Testing & Qualität

- **Unit‑Tests**: core‑geometry (Mapping, Rotation), Hit‑Tests, Tool‑Logik.
- **Component‑Tests**: Angular Wrapper (Event‑Durchreichung, Change Detection).
- **E2E**: Drag‑&‑Drop von Playercard, Zeichnen eines Pfeils, Export erstellt PNG > 0 Bytes.
- **Visual Tests** (optional): Snapshot‑Vergleich von Export‑Canvas bei fixiertem Seed.
- **Performance**: einfache Pfadsimplifikation für Pen, Caching des Feldhintergrunds.

---

## 9) Build, Release & Distribution

- **Monorepo (Nx)** für DX: schnelle Builds, gemeinsame Tests/Storybook.
- Jede Lib als **publishable** mit `ng-packagr` und **public API**.
- **Release** via Changesets/semantic‑release (SemVer).
- Distribution als **npm‑Pakete** (öffentliche Registry o. GitHub Packages).
- **Lizenz**: eigene Engine → volle Kontrolle; empfehlenswert **MIT** für die UI‑Libs.

> Alternativ zur Monorepo‑Nutzung können Konsument\*innen die Pakete einfach per `npm i @jugger/field-ui ...` in **eigene Repos** ziehen (kein Monorepo‑Zwang).

---

## 10) Roadmap

### Phase 0 — Setup

- Nx‑Workspace, `libs/` Grundgerüste (core‑domain, core‑geometry, core‑engine, ui‑angular, tools‑draw, export‑screenshot).
- CI (GitHub Actions), Lint/Format, Prettier, basic Unit‑Tests.

### Phase 1 — Feld & Panels

- FieldCanvas (Render + 90°‑Rotation), TeamPanels (Drag‑&‑Drop zu Token).
- Token‑Darstellung (Farbe, Label/Nummer), Select/Move/Remove.

### Phase 2 — Toolbox & Drawings

- Pen, Arrow, Cone, Erase inkl. Optionen (Farbe/Width/Radius).
- Hit‑Tests & Overlay‑Previews.

### Phase 3 — Export

- Offscreen‑Komposition (Panels+Feld) → PNG Download.
- Basisthema (Farben/Abstände), DPI‑Skalierung.

### Phase 4 — Politur

- Undo/Redo (State‑History light), Snap‑to‑Grid optional.
- Persistenz: Szenen als JSON import/export.
- Doku & Storybook für UI‑Komponenten.

### Phase 5 — (nach MVP) Ausblick

- Animationen + GIF/WebM/MP4, PDF‑Poster/QR, später „PDF‑Tools“ (Merge/Rotate/Annotate).

---

## 11) Akzeptanzkriterien (MVP)

- 90°‑Rotation ändert **nur** die Ansicht; Datenkoordinaten bleiben stabil.
- Drag‑&‑Drop einer Playercard erzeugt Token **an der Drop‑Position** (±5 px).
- Pen/Arrow/Cone/Erase funktionieren mit korrekter Hitbox und Z‑Reihenfolge.
- Export erstellt ein **PNG** mit Feld **und** beiden Team‑Panels in ≤ 2 s (bei 1920×1080, moderner Desktop).

---

## 12) Risiken & Gegenmaßnahmen

- **Canvas‑Text/Fonds** flackern → nach `document.fonts.ready` rendern.
- **CORS** bei Avataren → eigene Assets hosten oder `crossOrigin` + korrekte Header.
- **Performance** bei langen Freihand‑Pfaden → Resampling/Simplify, Lazy‑Repaint.
- **Touch‑Gesten** (Mobile) → Pointer Events strikt, Hit‑Slop erhöhen.

---

## 13) Glossar

- **Token**: sichtbarer Spieler/Nutzer auf dem Feld (vom Playercard‑Drag erzeugt).
- **Drawing**: zeichnerisches Element (Freihand‑Pfad, Pfeil, Hütchen).
- **Scene**: Gesamtheit aus Feld, Tokens, Drawings, Ausrichtung.
- **Orientation**: reine Anzeigeausrichtung (Portrait/Landscape).

---

## 14) Anhänge

### 14.1 Tool‑Schnittstellen (Beispiel)

```ts
export interface Engine {
  setScene(scene: Scene): void;
  setTool(tool: Tool): void;
  render(): void;
  screenToField(p: { x: number; y: number }): { x: number; y: number };
  addToken(t: Token): void;
  moveToken(id: string, to: { x: number; y: number }): void;
  removeToken(id: string): void;
  addDrawing(d: Drawing): void;
  onChange(cb: (scene: Scene) => void): () => void;
}
```

```ts
export interface Tool {
  kind: "select" | "pen" | "arrow" | "cone" | "erase";
  onPointerDown(pt: { x: number; y: number }, scene: Scene, engine: Engine): void;
  onPointerMove(pt: { x: number; y: number }, scene: Scene, engine: Engine): void;
  onPointerUp(pt: { x: number; y: number }, scene: Scene, engine: Engine): void;
  drawOverlay?(ctx: CanvasRenderingContext2D, scene: Scene): void;
}
```

### 14.2 Koordinaten‑Mapping (Skizze)

- Field→Screen: `s = M * f`, mit `M = T * R(0|90°) * S`, abhängig von Orientation.
- Screen→Field: `f = M⁻¹ * s` (für Drag‑/Pointer‑Events).

---

**Ende des Projektplans.**
