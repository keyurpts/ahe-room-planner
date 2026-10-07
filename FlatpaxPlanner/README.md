# Flatpax Planner

React and TypeScript frontend foundation for a screenshot-driven room planner.
The foundation and first landing page are implemented, with a 404 fallback.
The landing page follows the supplied 1440 × 1024 export and opens custom modal
dialogs from its three actions. The preset-layout dialog is implemented from its
supplied design, and the new-design dialog contains room selection and a
project-name form. The saved-design dialog accepts a six-character design code.
Project creation and saved-design loading await backend/editor integration.

## Requirements and setup

Use Node.js 22.13+ within the Node 22 release line, or Node 24+
(Node 24 LTS recommended), and npm 10+.

```sh
npm ci
npm run dev
```

Commit `package-lock.json`; use `npm ci` for reproducible installs. If Node is
managed through nvm, activate an installed compatible version first.

## Commands

| Command                | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Vite development server                               |
| `npm run build`        | TypeScript checks and optimized build in `dist/`      |
| `npm run preview`      | Preview the production build locally                  |
| `npm run lint`         | Type-aware ESLint; warnings fail                      |
| `npm run lint:fix`     | Apply available lint fixes                            |
| `npm run typecheck`    | Check application and Vite config                     |
| `npm run format`       | Apply Prettier                                        |
| `npm run format:check` | Check formatting                                      |
| `npm run check`        | Lint, formatting, type checking, and production build |

Deploy `dist/` to a static host with HTTPS. Configure SPA history fallback to
`index.html` for nested URLs. Preview is for local verification, not hosting.

## Technology choices

- React and strict TypeScript for typed, focused components.
- Vite for development and production bundling.
- Tailwind CSS with its Vite plugin and CSS-first theme tokens.
- React Router data router for nested layouts, lazy route modules, and errors.
- Redux Toolkit and React Redux for typed shared state, actions, and selectors.
- A feature-scoped project slice for the setup-to-planner flow.
- Native Fetch API for a small service layer; no Axios dependency is needed.
- ESLint with type-aware TypeScript and React rules; Prettier handles formatting.

No UI kit, authentication implementation, mock backend, analytics SDK, or server
state library is installed before requirements justify one.

## Structure

```text
src/
  app/                 Application composition, Redux store, typed hooks, and routes
    routes/
  assets/              Bundled icons, images, fonts, illustrations
  components/
    feedback/          Loading and unexpected-error fallbacks
    layout/            Shared semantic layout
    ui/                Reusable primitives as designs establish patterns
  config/              Validated public environment settings
  constants/           Shared route paths and future constants
  features/            Business capabilities with colocated implementation
  hooks/               Cross-feature React hooks
  pages/               Thin route composition modules
  services/api/        Central Fetch client and error types
  state/               Shared UI state only
  styles/              Base styles and central theme tokens
  types/               Genuinely shared types
  utils/               Pure shared helpers
public/                Assets requiring stable URLs (otherwise prefer src/assets)
```

Import application code using `@/` (mapped consistently in TypeScript and Vite).
Feature code may use shared layers; shared layers should not import features or
pages. Keep types, services, hooks, and business rules close to their feature.
Use named exports, PascalCase components, descriptive names, and type-only imports.
Avoid `any`, catch-all barrels, duplicate logic, and premature abstractions.

## State strategy

Use `useState` or `useReducer` for local form values, expanded controls, and other
component interactions. Redux Toolkit is reserved for information shared across distant
components; subscribe to individual fields rather than the entire store. The
UI slice contains a color-scheme preference contract; visual theme
switching will follow design requirements. It is not persisted by default.

`features/planner/state/project-slice.ts` shares the project name, room type, and
selected shape across setup and planner routes. It retains only the draft in
session storage, validates restored data, and never stores server responses or
authentication tokens. Drafts survive a same-tab refresh; this is not cloud saving.
The active planner step is shared through the project Redux slice. Tool selection and dialog visibility stay in local component state.
Use the typed hooks in app/store-hooks.ts and feature slice actions. The store
is configured in app/store.ts; listener middleware persists project actions.
Persistence tolerates unavailable storage and invalid saved data. Existing draft
session data remains compatible. Redux DevTools is enabled only in development.

Server responses belong to the API/server state layer, not the UI store. When APIs
need caching, deduplication, invalidation, or optimistic updates, introduce TanStack
Query through an application provider in `app/`, feature query hooks, and feature
query keys. Route loaders can also call feature services. Avoid ad-hoc fetch effects
in large page components. Authentication and permission state require a real backend
contract; no placeholder user or misleading access guard is provided.

## Environment configuration

`.env.example`, `.env.development`, and `.env.production` contain public defaults.
Use ignored `.env.local` or `.env.<mode>.local` files for machine overrides, and CI
environment variables for deployment. All `VITE_*` values are embedded in the public
build: **never store credentials, private tokens, or backend secrets in them**.

| Variable                | Meaning                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `VITE_APP_ENV`          | `development`, `test`, `staging`, or `production`          |
| `VITE_API_BASE_URL`     | Optional HTTP(S) API origin/base path; required on API use |
| `VITE_ENABLE_ANALYTICS` | Strict `true`/`false` public feature flag                  |
| `VITE_ANALYTICS_ID`     | Public identifier required if analytics flag is enabled    |

Read settings only from `src/config/env.ts`. URL, environment, and feature flag
values are validated centrally. Analytics configuration does not load an SDK.
Environment validation executes at application startup; no
backend request is made at startup. Build-time variables require rebuilding to
change. When a backend is mandatory, make its URL a startup requirement here.

## API services

`createApiClient` supports a base URL, configurable timeouts, cancellation,
JSON request serialization, query parameters, headers, and an optional async token
provider. `fetchImpl` can be injected for isolated tests. Feature services call
`apiClient.request('/resource', { parse, ...options })`; the mandatory `parse`
function validates an `unknown` response against the feature's actual contract.
Empty responses (including 204) reach the decoder as `undefined`.

`ApiError` contains HTTP status and an unknown response body. Network and malformed
JSON failures use `ApiNetworkError`; timeout/cancellation preserve abort reasons.
Feature decoders own schema failures. Render safe user-facing messages rather than
raw server errors. Body support is JSON only; add explicit multipart/binary methods
when required. No automatic retries are used, to avoid duplicating mutations.

Supply token retrieval through the client factory when authentication is defined.
Do not persist tokens in the UI store by default. Cookie authentication, CSRF,
refresh flows, retries, and telemetry must follow backend requirements. Client
request preparation and response decoding provide central extension points without
an unused interceptor framework.

## Routing and errors

`app/routes/router.tsx` composes public routes under `AppLayout`. Route modules are
lazy-loaded; each exports `Component`, with optional loader/action/error exports
as required by React Router. Add authenticated or role-restricted route branches
with loader-based guards once session verification exists. Keep permission policy
in the relevant feature and enforce access on the server as well. Nested layouts
can render `Outlet` without reorganizing the route tree.

There is a wildcard 404, initial route loading fallback, route error boundary,
and top-level React render boundary. Add feature-specific loading, empty, and
recoverable error states when their semantics are known. Render errors currently
log to the console; replace that adapter with approved monitoring later.

## Design and responsiveness

`styles/theme.css` centralizes design colors, font stack, radii, shadows,
breakpoints, fluid heading typography, spacing scale, container width, and layer
conventions. Tailwind's CSS-first `@theme` generates reusable utilities. Update
these values as further Figma specifications arrive. Font loading is centralized
in `styles/fonts.css`. Montserrat is bundled locally as the approved temporary
Gotham-like alternative, with its license in `assets/fonts/Montserrat-OFL.txt`.
Switch to supplied Gotham webfonts here and update `--font-sans` when available.

Use mobile-first flex/grid layouts, fluid widths, sensible max widths, and
breakpoint utilities. A screenshot frame defines the reference viewport, never a
fixed application canvas. Landing actions use proportional grid columns on desktop
and stack below laptop width. The logo, gutters, and typography adapt to smaller
viewports. Small-screen text uses a darker teal for contrast. The background uses
an optimized WebP copy; the original supplied PNG is preserved. Use absolute
positioning only for true overlays/design needs.

Landing action selection stays in local state. The shared native-dialog wrapper
provides custom styling, modal focus containment, Escape/backdrop dismissal,
background scroll locking, and focus restoration. The preset dialog displays five
supplied layout patterns with hover, pressed, focus, and exclusive selection
states. Back and Close dismiss it; selection is local and resets on dismissal.
The next step after selecting a preset awaits its design. The new-design dialog uses native
radio inputs with exclusive selection and default/clicked icons. Project names
accept up to 100 characters; submission requires a room type and a trimmed,
nonblank name. Valid input advances to the room-shape chooser, using the project
name as its heading. The 505 × 604 reference popup contains six SVG room shapes
in 146 × 126 cards, with native radio selection and keyboard navigation. Back
preserves the name, room type, and selected shape; dismissal resets the flow.
Next requires a selected shape and opens the lazy-loaded `/planner` route with
the shared draft. The planner shell has a 74px desktop navigation, step controls,
Save/Item List buttons, a six-tool toolbar with 52px icons, and a bottom Next
action. Its 2D viewer is intentionally blank, with no grid or room drawing yet.
Walls & Floors replaces the toolbar with Back/Next controls and a central finishes
button using the supplied SVG. The 3D viewer stays blank. The nonmodal finishes
panel opens on the right at desktop size and fits within the viewport on mobile.
It supports keyboard tabs, Textures/Colours modes, Floor/Walls swatch selection,
reset controls, and All/Selection scope. Swatches remain empty as in the supplied
reference; state is local, and no texture or colour is applied to a renderer yet.
Close and Escape return focus to the finishes button. Room setup is marked complete
when advancing. Add Items has a 279px desktop catalogue sidebar, collapsible colour
and cabinet sections, four temporary 600mm cupboard entries, a placeholder SVG
thumbnail, and the nine supplied item-toolbar icons. Catalogue data and its typed
contract are in `features/planner/catalogue/catalogue.ts`, ready to be supplied by
a future service without changing sidebar components. Other groups show empty
states until products are supplied. Add buttons update a local quantity list;
Delete removes one selected unit, and Item List displays current quantities.
These quantities survive step changes but are not yet persisted on refresh.
After adding an item, Customise appears at the bottom of the catalogue. It swaps
the sidebar to Sink/Benchtops swatches with the supplied reset SVG. Back restores
the catalogue, added quantities, and focus. Finish choices stay in local state
across sidebar changes. Removing the last unit returns to the catalogue and hides
Customise. The viewer remains blank in both modes; textures and item placement
await backend/viewer integration.
Save explains the local draft and
pending cloud integration. Opening
`/planner` without a valid draft redirects home. Custom-wall drawing still shows
availability feedback until its design is supplied. No backend project is created.
Dismissal resets the form. All landing triggers display pressed styling and keep
selected styling while their dialog is open.

The saved-design popup follows the supplied 500 × 278 reference and reuses the
project-name input styling from `styles/text-input.css`. Empty or invalid design
codes show validation inside the field without resizing the popup. Codes are
normalized to uppercase with whitespace removed and must contain six characters.
Load Design validates the code and shows an availability message; it makes no
mock API request. Back, Escape, and backdrop dismissal reset the form and restore
focus. The screenshot supplies no close icon for this popup, so Back is its
visible dismissal control.

Semantic HTML, a skip link, focus-visible outlines, and reduced-motion support are
included. Future controls must cover relevant hover, active, selected, loading,
disabled, error, and keyboard states. Use native controls and only necessary ARIA.
Avoid premature memoization; route splitting is already enabled.

## Adding a screen

1. Analyze the supplied screenshot at its reference viewport and identify repeated
   patterns, assets, typography, spacing, and interaction requirements.
2. Ask for missing details only when they materially affect implementation.
3. Add business logic/services/types to `features/<name>/` and compose a small route
   module in `pages/<name>/`. Register its lazy import and shared path constant.
4. Extract reusable primitives only when a stable pattern appears; update theme
   tokens centrally and refactor repeated patterns instead of copying them.
5. Implement semantic interactions and responsive layouts; verify against the
   screenshot and smaller viewports.
6. Run `npm run check` after meaningful changes.

## Testing readiness

The API factory accepts a transport dependency and response decoders are pure
functions. Feature logic should stay independent of React where practical. This
supports future unit tests and component tests without a mock backend. Introduce
Vitest/Testing Library for meaningful behavior coverage when screens arrive, and
browser tests for critical workflows when those workflows exist. No test runner
or boilerplate has been added in this infrastructure-only phase.

## Catalogue API integration

Development uses `VITE_API_BASE_URL=http://172.16.17.185:5217/api`.
Set the deployment-specific base URL in the production environment; never put
API hosts in components. The backend must allow the frontend origin through CORS.

`features/planner/catalogue/catalogue-api.ts` uses RTK Query, already included in
Redux Toolkit, for validated responses, caching, and reconnect/focus refresh.
Categories and textures load when Add Items opens. Models load for the expanded
category, and the selected cupboard texture chooses the matching model variants.
Only active records are shown. Loading, empty, error, and retry states are provided.
Thumbnail storage keys are not treated as image URLs: the download-URL endpoint
provides temporary image URLs, refreshed before expiry and released from the
query cache when unused. Missing or failed images use the placeholder asset.

Added items retain category, model, texture, SKU, and region metadata. Item lists
use regional item numbers and prices. VITE_REGION_ID sets the initial region; the
future user flow can dispatch setRegionId from state/ui-slice.ts.
Benchtop styling and the 2D/3D renderer are not connected to these catalogue APIs.

## Planner pages

- `/planner/room-setup`: separate 2D room setup page (`pages/room-setup/route.tsx`).
- `/planner/design`: shared 3D page for Walls & Floors (`pages/design/route.tsx`).
- `/planner/design?step=items`: the same 3D page with the Add Items controls.
- `/planner`: redirects to Room Setup for compatibility.

The parent planner route provides the shared navigation, catalogue, tools, and
project dialogs while rendering the current page through an outlet. Project
`activeStep` is held in Redux and synchronized with the URL, including browser
Back/Forward navigation. Moving between planner pages preserves the current
editing session; leaving the planner triggers the unsaved-draft confirmation.
Temporary blue (2D) and green (3D) viewer backgrounds and labels identify the
renderer mounting areas; no actual room rendering has been implemented yet.
