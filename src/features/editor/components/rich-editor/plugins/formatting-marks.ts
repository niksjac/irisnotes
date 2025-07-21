import { MarkSpec } from 'prosemirror-model';

// Superscript mark
export const superscriptMark: MarkSpec = {
  parseDOM: [{ tag: 'sup' }],
  toDOM: () => ['sup', 0],
};

// Subscript mark
export const subscriptMark: MarkSpec = {
  parseDOM: [{ tag: 'sub' }],
  toDOM: () => ['sub', 0],
};

// Underline mark
export const underlineMark: MarkSpec = {
  parseDOM: [{ tag: 'u' }],
  toDOM: () => ['u', 0],
};

// Strikethrough mark (additional to basic schema)
export const strikethroughMark: MarkSpec = {
  parseDOM: [{ tag: 'del' }, { tag: 's' }, { tag: 'strike' }],
  toDOM: () => ['del', 0],
};

// Font family mark
export const fontFamilyMark: MarkSpec = {
  attrs: {
    fontFamily: { default: null },
  },
  parseDOM: [
    {
      tag: 'span[style*="font-family"]',
      getAttrs: (node: any) => {
        const style = node.getAttribute('style');
        const match = style.match(/font-family:\s*([^;]+)/);
        if (match) {
          // Clean up the font family value (remove quotes and sanitize)
          const fontFamily = match[1].trim().replace(/['"]/g, '');
          return { fontFamily };
        }
        return false;
      },
    },
  ],
  toDOM: mark => ['span', { style: `font-family: '${mark.attrs.fontFamily}', sans-serif` }, 0],
};

// Font size mark
export const fontSizeMark: MarkSpec = {
  attrs: {
    fontSize: { default: null },
  },
  parseDOM: [
    {
      tag: 'span[style*="font-size"]',
      getAttrs: (node: any) => {
        const style = node.getAttribute('style');
        const match = style.match(/font-size:\s*([^;]+)/);
        return match ? { fontSize: match[1].trim() } : false;
      },
    },
  ],
  toDOM: mark => ['span', { style: `font-size: ${mark.attrs.fontSize}` }, 0],
};

// Background color mark
export const backgroundColorMark: MarkSpec = {
  attrs: {
    backgroundColor: { default: null },
  },
  parseDOM: [
    {
      tag: 'span[style*="background-color"]',
      getAttrs: (node: any) => {
        const style = node.getAttribute('style');
        const match = style.match(/background-color:\s*([^;]+)/);
        return match ? { backgroundColor: match[1].trim() } : false;
      },
    },
  ],
  toDOM: mark => [
    'span',
    {
      style: `background-color: ${mark.attrs.backgroundColor}; padding: 2px 4px; border-radius: 3px`,
    },
    0,
  ],
};

// Helper functions for toggling marks
export const toggleFontFamily = (fontFamily: string, schema: any) => (state: any, dispatch: any) => {
  const { from, to } = state.selection;
  if (dispatch) {
    const hasFontFamily = state.doc.rangeHasMark(from, to, schema.marks.fontFamily);
    const existingMark =
      hasFontFamily &&
      state.doc
        .resolve(from)
        .marks()
        .find((m: any) => m.type === schema.marks.fontFamily);

    if (existingMark && existingMark.attrs.fontFamily === fontFamily) {
      dispatch(state.tr.removeMark(from, to, schema.marks.fontFamily));
    } else {
      const tr = state.tr.removeMark(from, to, schema.marks.fontFamily);
      const mark = schema.marks.fontFamily.create({ fontFamily });
      dispatch(tr.addMark(from, to, mark));
    }
  }
  return true;
};

export const toggleFontSize = (fontSize: string, schema: any) => (state: any, dispatch: any) => {
  const { from, to } = state.selection;
  if (dispatch) {
    const hasFontSize = state.doc.rangeHasMark(from, to, schema.marks.fontSize);
    const existingMark =
      hasFontSize &&
      state.doc
        .resolve(from)
        .marks()
        .find((m: any) => m.type === schema.marks.fontSize);

    if (existingMark && existingMark.attrs.fontSize === fontSize) {
      dispatch(state.tr.removeMark(from, to, schema.marks.fontSize));
    } else {
      const tr = state.tr.removeMark(from, to, schema.marks.fontSize);
      const mark = schema.marks.fontSize.create({ fontSize });
      dispatch(tr.addMark(from, to, mark));
    }
  }
  return true;
};

export const toggleBackgroundColor = (backgroundColor: string, schema: any) => (state: any, dispatch: any) => {
  const { from, to } = state.selection;
  if (dispatch) {
    const hasBgColor = state.doc.rangeHasMark(from, to, schema.marks.backgroundColor);
    const existingMark =
      hasBgColor &&
      state.doc
        .resolve(from)
        .marks()
        .find((m: any) => m.type === schema.marks.backgroundColor);

    if (existingMark && existingMark.attrs.backgroundColor === backgroundColor) {
      dispatch(state.tr.removeMark(from, to, schema.marks.backgroundColor));
    } else {
      const tr = state.tr.removeMark(from, to, schema.marks.backgroundColor);
      const mark = schema.marks.backgroundColor.create({ backgroundColor });
      dispatch(tr.addMark(from, to, mark));
    }
  }
  return true;
};

export const toggleSuperscript = (schema: any) => (state: any, dispatch: any) => {
  const { from, to } = state.selection;
  if (dispatch) {
    // Remove subscript if present (they're mutually exclusive)
    const tr = state.tr.removeMark(from, to, schema.marks.subscript);

    if (state.doc.rangeHasMark(from, to, schema.marks.superscript)) {
      dispatch(tr.removeMark(from, to, schema.marks.superscript));
    } else {
      const mark = schema.marks.superscript.create();
      dispatch(tr.addMark(from, to, mark));
    }
  }
  return true;
};

export const toggleSubscript = (schema: any) => (state: any, dispatch: any) => {
  const { from, to } = state.selection;
  if (dispatch) {
    // Remove superscript if present (they're mutually exclusive)
    const tr = state.tr.removeMark(from, to, schema.marks.superscript);

    if (state.doc.rangeHasMark(from, to, schema.marks.subscript)) {
      dispatch(tr.removeMark(from, to, schema.marks.subscript));
    } else {
      const mark = schema.marks.subscript.create();
      dispatch(tr.addMark(from, to, mark));
    }
  }
  return true;
};
