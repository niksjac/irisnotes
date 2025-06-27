import { EditorState, Plugin } from 'prosemirror-state';
import { keymap } from 'prosemirror-keymap';
import { history } from 'prosemirror-history';
import { baseKeymap } from 'prosemirror-commands';
import { dropCursor } from 'prosemirror-dropcursor';
import { gapCursor } from 'prosemirror-gapcursor';
import { inputRules } from 'prosemirror-inputrules';
import { Schema, Node } from 'prosemirror-model';

import { colorKeymap } from '../plugins/color-plugin';
import { createBaseKeymap } from '../plugins/keyboard-plugin';
import { currentLineHighlightPlugin } from '../plugins/line-highlight-plugin';
import { linkClickPlugin } from '../plugins/link-click-plugin';
import { createUrlInputRule } from '../input-rules';

interface CreateEditorStateOptions {
  doc: Node;
  schema: Schema;
  onToggleView: () => void;
}

export function createEditorState({ doc, schema, onToggleView }: CreateEditorStateOptions): EditorState {
  // Create keymap with plugins
  const myKeymap = keymap({
    ...baseKeymap,
    ...createBaseKeymap(schema, colorKeymap(schema), onToggleView)
  });

  const plugins: Plugin[] = [
    inputRules({ rules: [createUrlInputRule(schema)] }),
    myKeymap,
    history({ newGroupDelay: 20 }),
    dropCursor(),
    gapCursor(),
    currentLineHighlightPlugin,
    linkClickPlugin
  ];

  return EditorState.create({
    doc,
    plugins
  });
}