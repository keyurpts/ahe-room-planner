import type { Quaternion, Vector3 } from "three";
import { ConfiguratorEventType, type Undo_Redo_Payload } from "./event/ConfiguratorEventType";
import { Events } from "./event";

/**
 * Defines the types of actions supported by the 3D design history manager.
 */
export enum ActionTypeConfigure {
    LOAD_MODEL = "LOAD_MODEL",
    UPDATE_MODEL_TRANSFORM = "UPDATE_MODEL_TRANSFORM",
    REPLACE_MODEL = "REPLACE_MODEL",
    DELETE_MODEL = "DELETE_MODEL",
    UPDATE_MODEL_APPEARANCE = "UPDATE_MODEL_APPEARANCE",
    CREATE_PERMANENT_GROUP = "CREATE_PERMANENT_GROUP",
    UNGROUP_PERMANENT_GROUP = "UNGROUP_PERMANENT_GROUP",
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
export type HistoryEntryConfigure = {
    action: string;
    data: HistoryData;
};

export interface ConfigureModelSnapshot {
    modelName: string;
    position: Vector3;
    quaternion: Quaternion;
    scale: Vector3;

    callbacks: any;
    metadata: any;
    url: string;
    isSelectable: boolean;
}

export interface ConfigureSnapshot {
    models: ConfigureModelSnapshot[];
    isPermanentGroup: boolean
    permanentGroupName: string
}


/**
 * Manages undo and redo history for 3D design operations.
 *
 * Maintains separate stacks for undoable and redoable actions and
 * supports geometry updates, floor texture updates, and wall appearance changes.
 */
export class ConfigureHistoryManager {

    private undoStack: HistoryEntryConfigure[] = [];
    private redoStack: HistoryEntryConfigure[] = [];

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
     * @param {HistoryEntryConfigure} entry - The history entry containing the action and its associated data.
     * @returns {void}
     */
    public push(entry: HistoryEntryConfigure): void {
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
     * @returns {HistoryEntryConfigure | undefined} The history entry to undo, or undefined if the undo stack is empty.
     */
    public undo(): HistoryEntryConfigure | undefined {
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
     * @returns {HistoryEntryConfigure | undefined} The history entry to redo, or undefined if the redo stack is empty.
     */
    public redo(): HistoryEntryConfigure | undefined {
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
      public getUndoRedoPayload() : Undo_Redo_Payload{
        return {
          undo_stack_size : this.undoStack.length,
          redo_stack_size : this.redoStack.length
        }
      }

}