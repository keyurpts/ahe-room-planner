# UI primitives

Add primitives when supplied designs establish reusable patterns. Use semantic
controls, visible focus, labels, appropriate ARIA, and relevant interaction states.
Do not add a component library or speculative primitives before they are needed.

Use `Button` with `brand-outline` for white buttons with a teal hover state.
Use `navigation` for dialog Back/Next buttons, which also increase border width on hover.
Keep layout-specific sizing in the feature stylesheet. Border widths, corner radius and
navigation shadows are defined centrally in `styles/theme.css`.

Use `CloseIcon` inside a semantic, labelled button. It supplies consistent default,
hover, pressed and keyboard-focus artwork without owning dismissal behavior.

Use `ToolbarDropdown` for grouped toolbar choices. Pass `onClear` only when a
selection can be toggled off; camera and units always retain a selection.
