# Style guide — Angular

When in doubt, prefer consistency within a file over these rules.

This guide does _not_ cover TypeScript or general coding practices unrelated to Angular.

## Naming

- Separate words in file names with hyphens: `user-profile.ts`.
- Name test files with `.spec.ts` suffix: `user-profile.spec.ts`.
- Match file names to the TypeScript identifier within: a component `UserProfile` lives in `user-profile.ts`.
- Use the same base name for a component's TS, template, and styles: `user-profile.ts`, `user-profile.html`, `user-profile.scss`.
- Avoid abbreviations. Use full, descriptive names everywhere (TypeScript identifiers, CSS custom properties, Sass variables, HTML attributes). Only universally understood abbreviations are allowed (`html`, `url`, `id`, `nav`).

```scss
/* PREFER */
--background: var(--mat-sys-surface-container-lowest);

/* AVOID */
--bg: var(--mat-sys-surface-container-lowest);
```

## Project structure

- All application code lives inside `src/`.
- Bootstrap the application in `main.ts` directly inside `src`.
- Group a component's TS, template, styles, and tests in the same directory.
- Organise by feature area, not by file type.
- One concept per file (one component, directive, or service per file).
- Avoid overly generic file names like `helpers.ts`, `utils.ts`, or `common.ts`.

## Dependency injection

- Prefer the `inject` function over constructor parameter injection.

## Components and directives

- Use the same application-specific prefix for directive selectors as for components.
- Use camelCase for attribute directive selectors: `[mrTooltip]`.
- Group Angular-specific properties (injected dependencies, inputs, outputs, queries) near the top of the class, before methods.
- Keep components focused on presentation. Factor out validation rules, data transformations, and business logic into separate functions or classes.
- Avoid complex logic in templates. Move it to a `computed` signal in the TypeScript code.

## Angular Material

- Use Material components and design tokens whenever possible.
- Use Angular Material components with their default styling. Only override tokens or appearance when there is a clear design requirement that cannot be met with default theming.
- When M3 specifies a component Angular Material hasn't implemented yet, use the closest available Material component with its default appearance rather than restyling to match the M3 spec.
- When you do need to customise, use Angular Material's styling API in this order of preference:
  1. **System-level CSS custom properties** (`--mat-sys-*` tokens)
  2. **Component-level override mixins** (Sass mixins per component)
  3. **Component-level CSS custom properties** (`--mat-*` scoped to a component)

```scss
/* PREFER — Sass mixin */
@use '@angular/material' as mat;

:root {
  @include mat.sidenav-overrides((
    container-background-color: var(--mat-sys-primary-container),
  ));
}

/* ACCEPTABLE — system-level token */
.shell-sidenav {
  background-color: var(--mat-sys-primary-container);
}

/* AVOID — targeting internal Material classes */
.shell-sidenav .mat-drawer-inner-container {
  background-color: #d3e3fd;
}
```

- Do not set `standalone: true` explicitly. Standalone components are the default in this repository; only set it if you have an explicit reason to use `standalone: false`.
- Do not add comments unless explicitly requested. Code should be self-explanatory through clear naming and structure.

## Signals

- Use `signal` for component/service state.
- Name signals with a noun.
- Mutate with `set` / `update`; never reassign the whole signal.
- Derive read-only values with `computed` (pure, no side-effects).
- Run side-effects with `effect`; clean them up on destroy.
- Prefer signals over observables. Only fall back to observables when you need cancellation, multicasting, or an external library requires them. Convert with `toSignal` / `fromSignal`.
- Keep signals, computed, and effects grouped near the top of the class.
- Never expose a `WritableSignal` from a public API.
- Prefer signal-based inputs using `input()` over `@Input()`.

## Access modifiers

- Use `protected` on class members that are only used by a component's template.
- Use `readonly` for properties initialised by `input`, `model`, `output`, and queries.

```typescript
@Component({
  template: `<p>{{ fullName() }}</p>`,
})
export class UserProfile {
  readonly firstName = input();
  readonly lastName = input();

  protected fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
}
```

## Template bindings

- Prefer `class` and `style` bindings over `ngClass` and `ngStyle`.

```html
<!-- PREFER -->
<div [class.admin]="isAdmin" [class.dense]="density === 'high'">
<div [style.color]="textColor">

<!-- AVOID -->
<div [ngClass]="{admin: isAdmin}" [ngStyle]="{'color': textColor}">
```

## Event handlers

- Name event handlers for what they _do_, not for the triggering event: `saveUserData()` not `handleClick()`.
- Use Angular's key event modifiers for keyboard events: `(keydown.control.enter)="commitNotes()"`.

## Lifecycle hooks

- Keep lifecycle methods simple. Extract logic into well-named methods and call those from the hook.
- Implement the corresponding TypeScript interface for each lifecycle hook (`OnInit`, `OnDestroy`, etc.).
