/**
 * Defines the types of events dispatched by the configurator.
 */
export declare enum ConfiguratorEventType {
    /**
     * Fired when a wall's dimensions are edited.
     */
    EDIT_WALL_DIMENIONS = "editWallDimension",
    /**
     * Fired when a 3D model is selected.
     */
    MODEL_SELECTED = "modelSelected",
    /**
     * Fired when a collision event is detected.
     */
    COLLISION = "collision",
    /**
     * Fired when a 3D model is cloned.
     */
    CLONE = "clone",
    /**
     * Fired when a 3D model is replaced.
     */
    REPLACE = "replace",
    /**
     * Fired when model preview/placement mode is cancelled.
     */
    PREVIEW_CANCELLED = "previewCancelled",
    /**
     * Fired to request a context menu for a selected model.
     */
    MODEL_CONTEXT_MENU = "modelContextMenu",
    /**
     * Fired when the scene hierarchy of models changes.
     */
    HIERARCHY_CHANGED = "hierarchyChanged",
    /**
     * Fired when the summary of loaded models is updated.
     */
    MODELS_SUMMARY_UPDATED = "modelsSummaryUpdated",
    /**
     * Fired when a 3D model is hovered.
     */
    MODEL_HOVERED = "modelHovered",
    /**
     * Fired when rotation of a model changes.
     */
    ROTATION_CHANGED = "rotationChanged"
}
