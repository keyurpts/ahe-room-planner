/**
 * Event fired when the distance between two measured 3D objects updates.
 */
export const OBJECT_DISTANCE_UPDATED = 'objectDistanceUpdated';

/**
 * Color values for visual bounding box helpers.
 */
export const MEASUREMENT_BOX_COLORS = {
  MODEL_A: 0x3b82f6, // Blue
  MODEL_B: 0x10b981, // Emerald green
} as const;

/**
 * Visual elevation threshold to keep measurement lines clearly visible above the floor plane.
 */
export const MIN_MEASUREMENT_Y = 0.15;
