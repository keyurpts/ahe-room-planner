import { ConfiguratorEventType, Events } from "../event";
import { type Undo_Redo_Payload } from '../event/ConfiguratorEventType';


export enum ActionType {
  ADD_WALL = "ADD_WALL",
  DELETE_WALL = "DELETE_WALL",
  UPDATE_WALL = "UPDATE_WALL",
  UPDATE_ROOM_NAME = "UPDATE_ROOM_NAME"
}

interface WallHistoryData {
  oldGroups: string[];
  newGroups: string[];
  affectedRoomNames ? : Map<string, string>
}

interface DeleteWallHistoryData {
  oldGroups: string[];
  affectedRoomNames: Map<string, string>;
}

interface UpdateRoomNameHistoryData {
  oldRoomNames: Map<string, string>;
  newRoomNames: Map<string, string>;
}

export type HistoryEntry =
  | {
      action: ActionType.ADD_WALL;
      data: WallHistoryData;
    }
  | {
      action: ActionType.UPDATE_WALL;
      data: WallHistoryData;
    }
  | {
      action: ActionType.DELETE_WALL;
      data: DeleteWallHistoryData;
    }
  | {
      action: ActionType.UPDATE_ROOM_NAME;
      data: UpdateRoomNameHistoryData;
    }
  | {
      action :string,
      data :any
    };

export class Design2DHistoryManager  {


  private undoStack: (HistoryEntry ) [] = [];
  private redoStack: (HistoryEntry ) [] = [];

  private undoRedoLimit : number = 10;

  /**
   * Setter for undo-redo limit
   */
  public setUndoRedoLimit(limit : number){
    if(limit > 0){
      this.undoRedoLimit = limit;
    }
  }
  /**
   * Push a new history entry.
   * Clear redo history when a new action is performed.
   */
  public push(entry: (HistoryEntry )): void {
    if(this.undoStack.length < this.undoRedoLimit){
          this.undoStack.push(entry);
          this.redoStack = [];
    }
    else{
        this.undoStack.shift();
        this.undoStack.push(entry);
    }
    Events.emit(ConfiguratorEventType.UNDO_REDO, this.getUndoRedoPayload());
  }

  /**
   * Undo the most recent action.
   */
  public undo(): (HistoryEntry ) | undefined {
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
   * Redo the most recently undone action.
   */
  public redo(): (HistoryEntry ) | undefined {
    const entry = this.redoStack.pop();

    if (entry) {
      this.undoStack.push(entry);
    }
    Events.emit(ConfiguratorEventType.UNDO_REDO, this.getUndoRedoPayload());
    return entry;
  }

  /**
   * Clears the undo and redo history stacks.
   */
  public clear(): void {
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
