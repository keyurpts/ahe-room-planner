// Export main 3D configurator class
export { ConfiguratorCore } from './ConfiguratorCore';

// Export type definitions
export type { ConfigState, ConfiguratorOptions } from './types/types';

// Export floorplan manager class for 2D design
export { FloorplanManager } from './Components/FloorplanManager';

// Export room editor interaction modes and measurement units
export { RoomEditorMode, TransformControlsMode, LengthUnit, normalizeLengthUnit, RequiredStrings } from './Constants'

// Export predefined 2D floorplan shape templates
export { Predefined2DShapes } from './shapeTemplates';

// Export configurator event classes and event types
export { Events, ConfiguratorEventType } from './event';

// Export Design2D and Design3D for wrapper extensions
export { Design2D } from './Components/Design2D';
export { Design3D } from './Components/Design3D';

