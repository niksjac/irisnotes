interface HotkeyItem {
  key: string;
  description: string;
  category: string;
}

export function HotkeysView() {
  const hotkeys: HotkeyItem[] = [
    // Application shortcuts
    { key: 'Ctrl+B', description: 'Toggle Notes Sidebar', category: 'Application' },
    { key: 'Ctrl+J', description: 'Toggle Activity Bar', category: 'Application' },
    { key: 'Ctrl+D', description: 'Toggle Dual-pane Mode', category: 'Application' },
    { key: 'Alt+Z', description: 'Toggle Line Wrapping', category: 'Application' },
    { key: 'F5', description: 'Reload Note', category: 'Application' },
    { key: 'Ctrl++', description: 'Increase Editor Font Size', category: 'Application' },
    { key: 'Ctrl+-', description: 'Decrease Editor Font Size', category: 'Application' },

    // Editor formatting
    { key: 'Ctrl+B', description: 'Bold', category: 'Editor - Formatting' },
    { key: 'Ctrl+I', description: 'Italic', category: 'Editor - Formatting' },
    { key: 'Ctrl+`', description: 'Code', category: 'Editor - Formatting' },

    // Editor headings
    { key: 'Ctrl+Shift+1', description: 'Heading 1', category: 'Editor - Headings' },
    { key: 'Ctrl+Shift+2', description: 'Heading 2', category: 'Editor - Headings' },
    { key: 'Ctrl+Shift+3', description: 'Heading 3', category: 'Editor - Headings' },
    { key: 'Ctrl+Shift+4', description: 'Heading 4', category: 'Editor - Headings' },
    { key: 'Ctrl+Shift+5', description: 'Heading 5', category: 'Editor - Headings' },
    { key: 'Ctrl+Shift+6', description: 'Heading 6', category: 'Editor - Headings' },
    { key: 'Ctrl+Shift+0', description: 'Paragraph', category: 'Editor - Headings' },

    // Editor lists
    { key: 'Ctrl+Shift+8', description: 'Bullet List', category: 'Editor - Lists' },
    { key: 'Ctrl+Shift+9', description: 'Ordered List', category: 'Editor - Lists' },
    { key: 'Ctrl+[', description: 'Outdent List Item', category: 'Editor - Lists' },
    { key: 'Ctrl+]', description: 'Indent List Item', category: 'Editor - Lists' },

    // Editor colors
    { key: 'Ctrl+Shift+R', description: 'Red Color', category: 'Editor - Colors' },
    { key: 'Ctrl+Shift+G', description: 'Green Color', category: 'Editor - Colors' },
    { key: 'Ctrl+Shift+L', description: 'Blue Color', category: 'Editor - Colors' },
    { key: 'Ctrl+Shift+Y', description: 'Yellow Color', category: 'Editor - Colors' },
    { key: 'Ctrl+Shift+P', description: 'Purple Color', category: 'Editor - Colors' },
    { key: 'Ctrl+Shift+C', description: 'Clear Color', category: 'Editor - Colors' },

    // Editor structure
    { key: 'Ctrl+Shift+.', description: 'Blockquote', category: 'Editor - Structure' },
    { key: 'Enter', description: 'New Paragraph', category: 'Editor - Structure' },
    { key: 'Shift+Enter', description: 'Line Break', category: 'Editor - Structure' },

    // Editor movement
    { key: 'Alt+↑', description: 'Move Line Up', category: 'Editor - Movement' },
    { key: 'Alt+↓', description: 'Move Line Down', category: 'Editor - Movement' },
    { key: 'Ctrl+Shift+Alt+↑', description: 'Copy Line Up', category: 'Editor - Movement' },
    { key: 'Ctrl+Shift+Alt+↓', description: 'Copy Line Down', category: 'Editor - Movement' },

    // Editor links
    { key: 'Ctrl+Enter', description: 'Open Link at Cursor', category: 'Editor - Links' },

    // Editor history
    { key: 'Ctrl+Z', description: 'Undo', category: 'Editor - History' },
    { key: 'Ctrl+Y', description: 'Redo', category: 'Editor - History' },
    { key: 'Ctrl+Shift+Z', description: 'Redo (Alternative)', category: 'Editor - History' },

    // Editor modes
    { key: 'Ctrl+Shift+S', description: 'Toggle Source View', category: 'Editor - Modes' },

    // Hotkey sequences
    { key: 'Ctrl+K, R', description: 'Open App Config Folder', category: 'Sequences' },
  ];

  const categories = Array.from(new Set(hotkeys.map(h => h.category))).sort();

  const formatKey = (key: string) => {
    return key
      .replace(/Ctrl/g, '⌘')
      .replace(/Alt/g, '⌥')
      .replace(/Shift/g, '⇧')
      .replace(/Enter/g, '↵')
      .replace(/↑/g, '↑')
      .replace(/↓/g, '↓');
  };

  return (
    <div style={{
      padding: 'var(--space-lg)',
      height: '100%',
      overflow: 'auto',
      background: 'var(--bg-primary)'
    }}>
      <h1 style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: '600',
        margin: '0 0 var(--space-lg) 0',
        color: 'var(--text)'
      }}>
        Keyboard Shortcuts
      </h1>

      <div style={{
        marginBottom: 'var(--space-lg)',
        padding: 'var(--space-md)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '6px'
      }}>
        <p style={{
          margin: 0,
          fontSize: 'var(--font-size-sm)',
          color: 'var(--text-3)',
          lineHeight: '1.5'
        }}>
          <strong>Note:</strong> On macOS, use Cmd (⌘) instead of Ctrl for most shortcuts.
          Hotkey sequences require pressing keys in order (e.g., Ctrl+K, then R).
        </p>
      </div>

      {categories.map(category => {
        const categoryHotkeys = hotkeys.filter(h => h.category === category);
        return (
          <section key={category} style={{ marginBottom: 'var(--space-xl)' }}>
            <h2 style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: '500',
              margin: '0 0 var(--space-md) 0',
              color: 'var(--text)',
              borderBottom: '1px solid var(--border)',
              paddingBottom: 'var(--space-sm)'
            }}>
              {category}
            </h2>

            <div style={{
              display: 'grid',
              gap: 'var(--space-xs)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: 'var(--space-md)'
            }}>
              {categoryHotkeys.map((hotkey, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--space-sm)',
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px'
                }}>
                  <span style={{
                    color: 'var(--text)',
                    fontSize: 'var(--font-size-sm)'
                  }}>
                    {hotkey.description}
                  </span>
                  <code style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: 'var(--font-size-xs)',
                    fontFamily: 'monospace',
                    border: '1px solid var(--border)'
                  }}>
                    {formatKey(hotkey.key)}
                  </code>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <section style={{
        marginTop: 'var(--space-xl)',
        padding: 'var(--space-md)',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '6px'
      }}>
        <h3 style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: '500',
          margin: '0 0 var(--space-sm) 0',
          color: 'var(--text)'
        }}>
          Tips
        </h3>
        <ul style={{
          margin: 0,
          paddingLeft: 'var(--space-lg)',
          color: 'var(--text-3)',
          fontSize: 'var(--font-size-sm)',
          lineHeight: '1.6'
        }}>
          <li>Most shortcuts work when focus is on the editor</li>
          <li>Formatting shortcuts apply to selected text or at cursor position</li>
          <li>List shortcuts work within list items to indent/outdent</li>
          <li>Color shortcuts can be combined with text selection</li>
          <li>Sequence shortcuts like "Ctrl+K, R" require releasing the first key combination before pressing the second</li>
          <li>Some shortcuts may be overridden by your browser or operating system</li>
        </ul>
      </section>
    </div>
  );
}