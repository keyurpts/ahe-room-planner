import { Design2D, RoomEditorMode } from 'three-configurator';

/**
 * Wrapper around Design2D.
 */
export class Design2DWrapper extends Design2D {
  private initialRooms = 0;

  /**
  * Sets the room editor mode and updates the initial room count when drawing mode is activated.
  *
  * @param mode - The editor mode to set.
  * @param active - Whether the specified mode should be activated.
  * @param isExplicit - Whether the mode change was explicitly requested.
  */
  override async setMode(mode: RoomEditorMode, active: boolean, isExplicit = false) {
    super.setMode(mode, active, isExplicit);

    if (mode === RoomEditorMode.DRAW && active) {
      const rooms = await super.detectRooms();
      this.initialRooms = rooms.length;
    }
  }

  /**
  * Detects rooms and deactivates drawing mode when new rooms are detected.
  *
  * @param args - Arguments passed to the room detection method.
  */
  protected override async detectRooms(...args: Parameters<Design2D['detectRooms']>) {
    const rooms = await super.detectRooms(...args);

    if (rooms.length > this.initialRooms) {
      this.setMode(RoomEditorMode.DRAW, false);
      this.initialRooms = rooms.length;
    }

    return rooms;
  }
}
