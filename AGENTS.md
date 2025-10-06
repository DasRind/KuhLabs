# Agent & Coding Guidelines

Scope: This file applies to the entire repository. Agents and contributors should follow these rules when creating or modifying code.

## Angular Style Guide (Repository Standard)

- Components

  - Prefer `standalone` components where practical.
  - Order: public Inputs/Outputs, lifecycle hooks, public methods, private fields/methods.
  - Strong typing for Inputs/Outputs. Avoid `any`. Provide sensible defaults.

- Templates (HTML)

  - Prefer Angular control flow syntax: `@if`, `@for`, `@switch` (Angular 17+). Where not available, fall back to `*ngIf`/`*ngFor` with `trackBy`.
  - Use `async` pipe for Observables instead of manual subscriptions in components.
  - Accessibility: semantic elements first; interactive controls as `<button>`/`<a>` with proper `aria-*` when needed.
  - No inline styles; keep templates lean and readable.

- Styling (SCSS)

  - No global/prefix requirement; keep class names meaningful and scoped to the component.
  - Avoid deep nesting (>3 levels) and `!important`.
  - Use shared design tokens/variables where available. Do not hardcode colors/spacing if tokens exist.
  - Avoid dublicated Code and delete what is unneccessary

- Naming & Structure

  - Files: `feature-name.component.ts|html|scss`. Selector: `app-feature-name` unless an app-specific convention exists.
  - Services end with `Service`, pipes with `Pipe`, directives with `Directive`.
  - Utilities without Angular dependencies go under a `utils` folder.

- Inputs/Outputs

  - Inputs are descriptive (e.g., `size`, `variant`); booleans use positive logic (e.g., `disabled`).
  - Outputs use event semantics (e.g., `closed`, `submitted`). Avoid two-way binding unless it is a form-like control.

- RxJS & State

  - Prefer ViewModel pattern: expose a `vm$` observable for templates combining required streams.
  - Avoid manual `subscribe` in components unless side effects are required. Use `takeUntilDestroyed()` when subscribing.
  - Services expose Observables; Subjects are private with `asObservable()` for exposure.

- Forms

  - Prefer Reactive Forms. Define validators in TS; display errors consistently in templates.

- Testing

  - Minimum per component: render test, one user interaction case, and one edge case.
  - For services with complex streams, consider marble tests; otherwise use clear Arrange/Act/Assert.

- Performance

  - Always add `trackBy` to lists (`@for (item of items; track item.id)` or a function).
  - Use pure pipes for heavy transformations; avoid expensive work in template bindings.
  - Lazy-load features/assets where applicable.

- Documentation
  - Add short JSDoc to public Inputs/Outputs. Briefly describe component purpose and constraints.

## Agent Working Rules

- Minimal, focused diffs: change only what is needed for the task.
- Respect this AGENTS.md. When in doubt, ask or leave a short note in the PR.
- Use plans for multi-step tasks. Keep exactly one step `in_progress`.
- Validate with `npm run lint`, `npm run test`, `npm run build` where relevant.
