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

// Shared plugin manager for memory optimization
class SharedPluginManager {
  private static instance: SharedPluginManager;
  private sharedPlugins: Map<string, Plugin> = new Map();

  static getInstance(): SharedPluginManager {
    if (!SharedPluginManager.instance) {
      SharedPluginManager.instance = new SharedPluginManager();
    }
    return SharedPluginManager.instance;
  }

  getSharedPlugins(schema: Schema): Plugin[] {
    const schemaKey = this.getSchemaKey(schema);

    if (!this.sharedPlugins.has(`dropCursor-${schemaKey}`)) {
      // Create shared stateless plugins once per schema
      this.sharedPlugins.set(`dropCursor-${schemaKey}`, dropCursor());
      this.sharedPlugins.set(`gapCursor-${schemaKey}`, gapCursor());
    }

    return [
      this.sharedPlugins.get(`dropCursor-${schemaKey}`)!,
      this.sharedPlugins.get(`gapCursor-${schemaKey}`)!
    ];
  }

  createStatefulPlugins(schema: Schema, onToggleView: () => void): Plugin[] {
    // Create fresh instances of stateful plugins for each editor
    const myKeymap = keymap({
      ...baseKeymap,
      ...createBaseKeymap(schema, colorKeymap(schema), onToggleView)
    });

    return [
      inputRules({ rules: [createUrlInputRule(schema)] }),
      myKeymap,
      history({ newGroupDelay: 20 }), // History plugin maintains per-editor state
      currentLineHighlightPlugin, // Stateful - needs separate instance
      linkClickPlugin // Stateful - needs separate instance
    ];
  }

  private getSchemaKey(schema: Schema): string {
    // Create a simple key based on schema nodes and marks for caching
    const nodeNames = Object.keys(schema.nodes).sort().join(',');
    const markNames = Object.keys(schema.marks).sort().join(',');
    return `${nodeNames}-${markNames}`;
  }

  // Clear cache when needed (e.g., during hot reload in development)
  clearCache(): void {
    this.sharedPlugins.clear();
  }
}

export function createEditorState({ doc, schema, onToggleView }: CreateEditorStateOptions): EditorState {
  const pluginManager = SharedPluginManager.getInstance();

  // Get shared stateless plugins
  const sharedPlugins = pluginManager.getSharedPlugins(schema);

  // Create fresh stateful plugins for this editor instance
  const statefulPlugins = pluginManager.createStatefulPlugins(schema, onToggleView);

  // Combine shared and stateful plugins
  const plugins: Plugin[] = [
    ...statefulPlugins,
    ...sharedPlugins
  ];

  return EditorState.create({
    doc,
    plugins
  });
}

// Export plugin manager for potential cleanup in tests
export { SharedPluginManager };