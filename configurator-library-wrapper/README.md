# Configurator library wrapper

FlatpaxPlanner imports this package. This package consumes the fixed configurator-library npm package (named three-configurator) without changing its files.

Run npm install, npm run build, and npm test. Build before starting FlatpaxPlanner. There is no demo or development server in this package.

- src/FloorplanManager.ts: viewer lifecycle, room setup and frontend methods.
- src/units.ts: display units and conversions moved from the modified library.
- src/unit-bridge.ts: instance hooks needed because the fixed SDK does not expose unit-display extensions. These hooks depend on the current SDK implementation, validate at initialization, and are restored on disposal. They do not change physical drawing scale, SDK files, or prototypes.
- src/index.ts: package entry point and SDK event/type forwarding.

The local file dependency is for development. Replace it with a tested immutable registry version before publishing. Vite leaves the SDK external to the wrapper bundle.

The comparison found other reference-only changes: worktops, automatic placement, collision behavior, lighting/ceilings, object-to-object measurements and serialization. They are not yet moved. Keep Frontend/Library/three-configurator as a reference until these features have been ported and verified; do not discard its changes wholesale.
