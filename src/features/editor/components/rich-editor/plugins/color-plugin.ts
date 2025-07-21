import { MarkSpec } from 'prosemirror-model';

// Define color mark
export const colorMark: MarkSpec = {
  attrs: {
    color: { default: null },
  },
  parseDOM: [
    {
      tag: 'span[style*="color"]',
      getAttrs: (node: any) => {
        const style = node.getAttribute('style');
        const match = style.match(/color:\s*([^;]+)/);
        return match ? { color: match[1].trim() } : false;
      },
    },
  ],
  toDOM: mark => ['span', { style: `color: ${mark.attrs.color}` }, 0],
};

// Helper function to toggle color mark
export const toggleColor = (color: string, schema: any) => (state: any, dispatch: any) => {
  const { from, to } = state.selection;

  if (dispatch) {
    // Check if the selection already has this exact color
    const hasColor = state.doc.rangeHasMark(from, to, schema.marks.color);
    const existingMark =
      hasColor &&
      state.doc
        .resolve(from)
        .marks()
        .find((m: any) => m.type === schema.marks.color);

    if (existingMark && existingMark.attrs.color === color) {
      // Remove the color if it's the same
      dispatch(state.tr.removeMark(from, to, schema.marks.color));
    } else {
      // Remove any existing color marks first, then add the new one
      const tr = state.tr.removeMark(from, to, schema.marks.color);
      const mark = schema.marks.color.create({ color });
      dispatch(tr.addMark(from, to, mark));
    }
  }
  return true;
};

// Helper function to clear all color marks
export const clearColor = (schema: any) => (state: any, dispatch: any) => {
  const { from, to } = state.selection;
  if (dispatch) {
    dispatch(state.tr.removeMark(from, to, schema.marks.color));
  }
  return true;
};

// Color shortcuts configuration
export const colorKeymap = (schema: any) => ({
  'Mod-Shift-r': toggleColor('#e74c3c', schema), // Red
  'Mod-Shift-g': toggleColor('#27ae60', schema), // Green
  'Mod-Shift-l': toggleColor('#3498db', schema), // Blue
  'Mod-Shift-y': toggleColor('#f39c12', schema), // Yellow/Orange
  'Mod-Shift-p': toggleColor('#9b59b6', schema), // Purple
  'Mod-Shift-c': clearColor(schema), // Clear color
});
