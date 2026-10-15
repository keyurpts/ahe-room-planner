# Configurator library wrapper

FlatpaxPlanner imports this package, which consumes configurator-library (npm package name: three-configurator).

Run npm install, npm run build, and npm test. Build the base library first whenever its public API changes, then build this wrapper and start FlatpaxPlanner. There is no demo server.

## Unit display

FloorplanManager supplies wrapper-owned Design2DWrapper and Design3DWrapper instances through public SDK creation methods. Design3DWrapper supplies ConfiguratorCoreWrapper through the public core creation method.

The wrapper overrides public dimension methods for 2D display/input conversion and the public measurement method for 3D labels. Physical drawing scale remains unchanged. No private-field casts, runtime method replacement, guarded SDK bridge, or prototype changes are used.

The base library changes are limited to public access/export declarations and exposing its existing constructor calls as public creation methods. Their default implementations retain the original constructor arguments and behavior. All unit logic remains here.

## Files

- src/FloorplanManager.ts: wrapper entry point and lifecycle.
- src/Design2DWrapper.ts: 2D display/input conversion.
- src/Design3DWrapper.ts: creates the wrapper-owned 3D core.
- src/ConfiguratorCoreWrapper.ts: 3D measurement label formatting.
- src/units.ts: shared unit conversions.

Other modified-library features remain in Frontend/Library/three-configurator as reference material for later migration.

Predefined shapes use the base library's Predefined2DShapes and addPredefinedShape API. The wrapper does not create or automatically place custom room templates.
