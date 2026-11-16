import { Events } from "./event";
import { ConfiguratorEventType, type Undo_Redo_Payload } from "./event/ConfiguratorEventType";

/**
 * Defines the types of actions supported by the 3D design history manager.
 */
export enum ActionType3D {
    GEOMETRY_UPDATE = "GEOMETRY_UPDATE",
    UPDATE_FLOOR_APPEARANCE = "UPDATE_FLOOR_APPEARANCE",
    UPDATE_WALL_APPEARANCE = "UPDATE_WALL_APPEARANCE",
}

/**
 * Represents the data associated with a history entry.
 *
 * @property {any} oldData - The data before the operation was applied.
 * @property {any} newData - The data after the operation was applied.
 */
interface HistoryData {
    oldData: any;
    newData: any;
}

/**
 * Represents a single entry in the 3D design history.
 *
 * @property {string} action - The type of action performed.
 * @property {HistoryData} data - The old and new data associated with the action.
 */
export type HistoryEntry3D = {
    action: string;
    data: HistoryData;
};

/**
 * Represents the appearance properties of a material.
 *
 * @property {number} materialIndex - The index of the material in the mesh material array.
 * @property {string} url - The URL of the applied texture.
 * @property {number} repeatX - The horizontal texture repeat value.
 * @property {number} repeatY - The vertical texture repeat value.
 * @property {string | null} color - The material color, or null if no solid color is specified.
 */
export type MaterialAppearanceData = {
    materialIndex: number;
    url: string;
    repeatX: number;
    repeatY: number;
    color: string | null;
};

/**
 * Represents the appearance data of a wall mesh.
 *
 * @property {string} meshId - The unique identifier of the wall mesh.
 * @property {MaterialAppearanceData[]} materials - The appearance properties of the wall's materials.
 */
export type WallAppearanceData = {
    meshId: string;
    materials: MaterialAppearanceData[];
};

/**
 * Manages undo and redo history for 3D design operations.
 *
 * Maintains separate stacks for undoable and redoable actions and
 * supports geometry updates, floor texture updates, and wall appearance changes.
 */
export class Design3DHistoryManager {

    private undoStack: HistoryEntry3D[] = [];
    private redoStack: HistoryEntry3D[] = [];

    private undoRedoLimit: number = 10;


    /**
    * Initializes the 3D design history manager.
    */
    constructor() {
    }

    /**
     * Setter for undo-redo limit
     */
    public setUndoRedoLimit(limit: number) {
        if (limit > 0) {
            this.undoRedoLimit = limit;
        }
    }

    /**
     * Adds a history entry to the undo stack and clears the redo stack.
     *
     * @param {HistoryEntry3D} entry - The history entry containing the action and its associated data.
     * @returns {void}
     */
    public push(entry: HistoryEntry3D): void {
        if (this.undoStack.length < this.undoRedoLimit) {
            this.undoStack.push(entry);
            this.redoStack = [];
        }
        else {
            this.undoStack.shift();
            this.undoStack.push(entry);
        }
        Events.emit(ConfiguratorEventType.UNDO_REDO, this.getUndoRedoPayload());
    }

    /**
     * Moves the most recent undo entry to the redo stack.
     *
     * @returns {HistoryEntry3D | undefined} The history entry to undo, or undefined if the undo stack is empty.
     */
    public undo(): HistoryEntry3D | undefined {
        const entry = this.undoStack.pop();

        if (entry) {
            this.redoStack.push(entry);
            if (this.undoStack.length > this.undoRedoLimit) {
                this.undoStack.shift();
            }
        }
        Events.emit(ConfiguratorEventType.UNDO_REDO, this.getUndoRedoPayload());
        return entry;
    }

    /**
     * Moves the most recent redo entry to the undo stack.
     *
     * @returns {HistoryEntry3D | undefined} The history entry to redo, or undefined if the redo stack is empty.
     */
    public redo(): HistoryEntry3D | undefined {
        const entry = this.redoStack.pop();

        if (entry) {
            this.undoStack.push(entry);
        }

        Events.emit(ConfiguratorEventType.UNDO_REDO, this.getUndoRedoPayload());
        return entry;
    }

    /**
     * Clears all undo and redo history entries.
     *
     * @returns {void}
     */
    public clearHistory(): void {
        this.undoStack = [];
        this.redoStack = [];
        Events.emit(ConfiguratorEventType.UNDO_REDO, this.getUndoRedoPayload());
    }

    /**
       * Get the payload with undo and redo stack size
       */
    public getUndoRedoPayload(): Undo_Redo_Payload {
        return {
            undo_stack_size: this.undoStack.length,
            redo_stack_size: this.redoStack.length
        }
    }

}