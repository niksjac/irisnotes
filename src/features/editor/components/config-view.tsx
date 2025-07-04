import { useTheme } from '../../theme';
import { useConfig } from '../../../hooks/use-config';

export function ConfigView() {
  const { darkMode, toggleDarkMode } = useTheme();
  const { config } = useConfig();

  return (
    <div style={{
      padding: 'var(--iris-space-lg)',
      height: '100%',
      overflow: 'auto',
      background: 'var(--iris-bg-primary)'
    }}>
      <h1 style={{
        fontSize: 'var(--iris-font-size-xl)',
        fontWeight: '600',
        margin: '0 0 var(--iris-space-lg) 0',
        color: 'var(--iris-text)'
      }}>
        Configuration
      </h1>

      {/* Theme Settings */}
      <section style={{ marginBottom: 'var(--iris-space-xl)' }}>
        <h2 style={{
          fontSize: 'var(--iris-font-size-lg)',
          fontWeight: '500',
          margin: '0 0 var(--iris-space-md) 0',
          color: 'var(--iris-text)',
          borderBottom: '1px solid var(--iris-border)',
          paddingBottom: 'var(--iris-space-sm)'
        }}>
          Theme Settings
        </h2>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--iris-space-md)',
          border: '1px solid var(--iris-border)',
          borderRadius: '6px',
          background: 'var(--iris-bg-secondary)'
        }}>
          <div>
            <div style={{
              fontWeight: '500',
              color: 'var(--iris-text)',
              marginBottom: 'var(--iris-space-xs)'
            }}>
              Dark Mode
            </div>
            <div style={{
              fontSize: 'var(--iris-font-size-sm)',
              color: 'var(--iris-text-muted)'
            }}>
              Toggle between light and dark theme
            </div>
          </div>
          <button
            onClick={toggleDarkMode}
            style={{
              padding: 'var(--iris-space-sm) var(--iris-space-md)',
              border: '1px solid var(--iris-border)',
              borderRadius: '4px',
              background: darkMode ? 'var(--iris-accent)' : 'var(--iris-bg-primary)',
              color: darkMode ? 'white' : 'var(--iris-text)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {darkMode ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </section>

      {/* Editor Settings */}
      <section style={{ marginBottom: 'var(--iris-space-xl)' }}>
        <h2 style={{
          fontSize: 'var(--iris-font-size-lg)',
          fontWeight: '500',
          margin: '0 0 var(--iris-space-md) 0',
          color: 'var(--iris-text)',
          borderBottom: '1px solid var(--iris-border)',
          paddingBottom: 'var(--iris-space-sm)'
        }}>
          Editor Settings
        </h2>

        <div style={{
          display: 'grid',
          gap: 'var(--iris-space-md)'
        }}>
          <div style={{
            padding: 'var(--iris-space-md)',
            border: '1px solid var(--iris-border)',
            borderRadius: '6px',
            background: 'var(--iris-bg-secondary)'
          }}>
            <div style={{
              fontWeight: '500',
              color: 'var(--iris-text)',
              marginBottom: 'var(--iris-space-xs)'
            }}>
              Editor Mode
            </div>
            <div style={{
              fontSize: 'var(--iris-font-size-sm)',
              color: 'var(--iris-text-muted)',
              marginBottom: 'var(--iris-space-sm)'
            }}>
              Choose your preferred editing mode
            </div>
            <select style={{
              padding: 'var(--iris-space-sm)',
              border: '1px solid var(--iris-border)',
              borderRadius: '4px',
              background: 'var(--iris-bg-primary)',
              color: 'var(--iris-text)',
              width: '200px'
            }}>
              <option value="rich">Rich Text Editor</option>
              <option value="source">Source Editor</option>
              <option value="split">Split View</option>
            </select>
          </div>

          <div style={{
            padding: 'var(--iris-space-md)',
            border: '1px solid var(--iris-border)',
            borderRadius: '6px',
            background: 'var(--iris-bg-secondary)'
          }}>
            <div style={{
              fontWeight: '500',
              color: 'var(--iris-text)',
              marginBottom: 'var(--iris-space-xs)'
            }}>
              Auto Save
            </div>
            <div style={{
              fontSize: 'var(--iris-font-size-sm)',
              color: 'var(--iris-text-muted)',
              marginBottom: 'var(--iris-space-sm)'
            }}>
              Automatically save changes as you type
            </div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--iris-space-sm)',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                defaultChecked={true}
                style={{ margin: 0 }}
              />
              <span style={{ color: 'var(--iris-text)' }}>Enable auto save</span>
            </label>
          </div>
        </div>
      </section>

      {/* Application Settings */}
      <section style={{ marginBottom: 'var(--iris-space-xl)' }}>
        <h2 style={{
          fontSize: 'var(--iris-font-size-lg)',
          fontWeight: '500',
          margin: '0 0 var(--iris-space-md) 0',
          color: 'var(--iris-text)',
          borderBottom: '1px solid var(--iris-border)',
          paddingBottom: 'var(--iris-space-sm)'
        }}>
          Application Settings
        </h2>

        <div style={{
          display: 'grid',
          gap: 'var(--iris-space-md)'
        }}>
          <div style={{
            padding: 'var(--iris-space-md)',
            border: '1px solid var(--iris-border)',
            borderRadius: '6px',
            background: 'var(--iris-bg-secondary)'
          }}>
            <div style={{
              fontWeight: '500',
              color: 'var(--iris-text)',
              marginBottom: 'var(--iris-space-xs)'
            }}>
              Default Category
            </div>
            <div style={{
              fontSize: 'var(--iris-font-size-sm)',
              color: 'var(--iris-text-muted)',
              marginBottom: 'var(--iris-space-sm)'
            }}>
              Default category for new notes
            </div>
            <select style={{
              padding: 'var(--iris-space-sm)',
              border: '1px solid var(--iris-border)',
              borderRadius: '4px',
              background: 'var(--iris-bg-primary)',
              color: 'var(--iris-text)',
              width: '200px'
            }}>
              <option value="general">General</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
            </select>
          </div>

          <div style={{
            padding: 'var(--iris-space-md)',
            border: '1px solid var(--iris-border)',
            borderRadius: '6px',
            background: 'var(--iris-bg-secondary)'
          }}>
            <div style={{
              fontWeight: '500',
              color: 'var(--iris-text)',
              marginBottom: 'var(--iris-space-xs)'
            }}>
              Show Word Count
            </div>
            <div style={{
              fontSize: 'var(--iris-font-size-sm)',
              color: 'var(--iris-text-muted)',
              marginBottom: 'var(--iris-space-sm)'
            }}>
              Display word count in editor status bar
            </div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--iris-space-sm)',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                defaultChecked={true}
                style={{ margin: 0 }}
              />
              <span style={{ color: 'var(--iris-text)' }}>Show word count</span>
            </label>
          </div>
        </div>
      </section>

      {/* Configuration Info */}
      <section>
        <h2 style={{
          fontSize: 'var(--iris-font-size-lg)',
          fontWeight: '500',
          margin: '0 0 var(--iris-space-md) 0',
          color: 'var(--iris-text)',
          borderBottom: '1px solid var(--iris-border)',
          paddingBottom: 'var(--iris-space-sm)'
        }}>
          Configuration Information
        </h2>

        <div style={{
          padding: 'var(--iris-space-md)',
          border: '1px solid var(--iris-border)',
          borderRadius: '6px',
          background: 'var(--iris-bg-secondary)',
          fontFamily: 'monospace',
          fontSize: 'var(--iris-font-size-sm)'
        }}>
          <pre style={{
            margin: 0,
            color: 'var(--iris-text)',
            whiteSpace: 'pre-wrap'
          }}>
            {JSON.stringify(config, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
}