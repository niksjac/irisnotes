import { useTheme } from '../../theme';
import { useConfig } from '../../../hooks/use-config';
import type { StorageSettings } from '../../../types';

export function ConfigView() {
  const { darkMode, toggleDarkMode } = useTheme();
  const { config, updateConfig } = useConfig();

  const handleStorageBackendChange = async (backend: StorageSettings['backend']) => {
    const newStorageConfig: StorageSettings = {
      backend
    };

    // Only add the relevant storage config for the selected backend
    if (backend === 'sqlite') {
      newStorageConfig.sqlite = {
        database_path: config.storage.sqlite?.database_path || 'notes.db'
      };
    } else if (backend === 'file-system') {
      newStorageConfig.fileSystem = {
        notes_directory: config.storage.fileSystem?.notes_directory || './notes'
      };
    } else if (backend === 'cloud') {
      newStorageConfig.cloud = {
        provider: config.storage.cloud?.provider || 'google-drive'
      };
    }

    await updateConfig({
      storage: newStorageConfig
    });
  };

  const handleSQLitePathChange = async (path: string) => {
    await updateConfig({
      storage: {
        ...config.storage,
        sqlite: {
          database_path: path
        }
      }
    });
  };

  const handleFileSystemPathChange = async (path: string) => {
    await updateConfig({
      storage: {
        ...config.storage,
        fileSystem: {
          notes_directory: path
        }
      }
    });
  };

  const handleCloudProviderChange = async (provider: 'google-drive' | 'dropbox' | 'onedrive') => {
    await updateConfig({
      storage: {
        ...config.storage,
        cloud: {
          provider
        }
      }
    });
  };

  const handleCustomConfigPathChange = async (path: string) => {
    const newProduction = { ...config.production };
    if (path) {
      newProduction.customConfigPath = path;
    } else {
      delete newProduction.customConfigPath;
    }
    await updateConfig({ production: newProduction });
  };

  const handleCustomDatabasePathChange = async (path: string) => {
    const newProduction = { ...config.production };
    if (path) {
      newProduction.customDatabasePath = path;
    } else {
      delete newProduction.customDatabasePath;
    }
    await updateConfig({ production: newProduction });
  };

  const handleCustomNotesPathChange = async (path: string) => {
    const newProduction = { ...config.production };
    if (path) {
      newProduction.customNotesPath = path;
    } else {
      delete newProduction.customNotesPath;
    }
    await updateConfig({ production: newProduction });
  };

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

      {/* Storage Settings */}
      <section style={{ marginBottom: 'var(--iris-space-xl)' }}>
        <h2 style={{
          fontSize: 'var(--iris-font-size-lg)',
          fontWeight: '500',
          margin: '0 0 var(--iris-space-md) 0',
          color: 'var(--iris-text)',
          borderBottom: '1px solid var(--iris-border)',
          paddingBottom: 'var(--iris-space-sm)'
        }}>
          Storage Settings
        </h2>

        <div style={{
          display: 'grid',
          gap: 'var(--iris-space-md)'
        }}>
          {/* Storage Backend Selection */}
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
              Storage Backend
            </div>
            <div style={{
              fontSize: 'var(--iris-font-size-sm)',
              color: 'var(--iris-text-muted)',
              marginBottom: 'var(--iris-space-sm)'
            }}>
              Choose how your notes are stored. Changing this will switch to the new storage - notes from other storages won't be visible until you switch back.
            </div>
            <select
              value={config.storage.backend}
              onChange={(e) => handleStorageBackendChange(e.target.value as StorageSettings['backend'])}
              style={{
                padding: 'var(--iris-space-sm)',
                border: '1px solid var(--iris-border)',
                borderRadius: '4px',
                background: 'var(--iris-bg-primary)',
                color: 'var(--iris-text)',
                width: '200px'
              }}
            >
              <option value="sqlite">SQLite Database</option>
              <option value="file-system">File System</option>
              <option value="cloud">Cloud Storage</option>
            </select>
          </div>

          {/* SQLite Configuration */}
          {config.storage.backend === 'sqlite' && (
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
                SQLite Database Path
              </div>
              <div style={{
                fontSize: 'var(--iris-font-size-sm)',
                color: 'var(--iris-text-muted)',
                marginBottom: 'var(--iris-space-sm)'
              }}>
                Path to the SQLite database file
              </div>
              <input
                type="text"
                value={config.storage.sqlite?.database_path || 'notes.db'}
                onChange={(e) => handleSQLitePathChange(e.target.value)}
                style={{
                  padding: 'var(--iris-space-sm)',
                  border: '1px solid var(--iris-border)',
                  borderRadius: '4px',
                  background: 'var(--iris-bg-primary)',
                  color: 'var(--iris-text)',
                  width: '300px',
                  fontFamily: 'monospace'
                }}
              />
            </div>
          )}

          {/* File System Configuration */}
          {config.storage.backend === 'file-system' && (
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
                Notes Directory
              </div>
              <div style={{
                fontSize: 'var(--iris-font-size-sm)',
                color: 'var(--iris-text-muted)',
                marginBottom: 'var(--iris-space-sm)'
              }}>
                Directory where note files will be stored (Not yet implemented)
              </div>
              <input
                type="text"
                value={config.storage.fileSystem?.notes_directory || './notes'}
                onChange={(e) => handleFileSystemPathChange(e.target.value)}
                disabled
                style={{
                  padding: 'var(--iris-space-sm)',
                  border: '1px solid var(--iris-border)',
                  borderRadius: '4px',
                  background: 'var(--iris-bg-tertiary)',
                  color: 'var(--iris-text-muted)',
                  width: '300px',
                  fontFamily: 'monospace'
                }}
              />
            </div>
          )}

          {/* Cloud Storage Configuration */}
          {config.storage.backend === 'cloud' && (
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
                Cloud Provider
              </div>
              <div style={{
                fontSize: 'var(--iris-font-size-sm)',
                color: 'var(--iris-text-muted)',
                marginBottom: 'var(--iris-space-sm)'
              }}>
                Choose your cloud storage provider (Not yet implemented)
              </div>
              <select
                value={config.storage.cloud?.provider || 'google-drive'}
                onChange={(e) => handleCloudProviderChange(e.target.value as 'google-drive' | 'dropbox' | 'onedrive')}
                disabled
                style={{
                  padding: 'var(--iris-space-sm)',
                  border: '1px solid var(--iris-border)',
                  borderRadius: '4px',
                  background: 'var(--iris-bg-tertiary)',
                  color: 'var(--iris-text-muted)',
                  width: '200px'
                }}
              >
                <option value="google-drive">Google Drive</option>
                <option value="dropbox">Dropbox</option>
                <option value="onedrive">OneDrive</option>
              </select>
            </div>
          )}

          {/* Storage Status */}
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
              Current Storage Status
            </div>
            <div style={{
              fontSize: 'var(--iris-font-size-sm)',
              color: 'var(--iris-text)',
              fontFamily: 'monospace'
            }}>
              Backend: {config.storage.backend}
              {config.storage.backend === 'sqlite' && (
                <div>Database: {config.storage.sqlite?.database_path}</div>
              )}
              {config.storage.backend === 'file-system' && (
                <div>Directory: {config.storage.fileSystem?.notes_directory}</div>
              )}
              {config.storage.backend === 'cloud' && (
                <div>Provider: {config.storage.cloud?.provider}</div>
              )}
            </div>
            <div style={{
              fontSize: 'var(--iris-font-size-xs)',
              color: 'var(--iris-text-muted)',
              marginTop: 'var(--iris-space-xs)'
            }}>
              ⚠️ Note: Changing storage backends will hide notes from other storages until you switch back
            </div>
          </div>
        </div>
      </section>

      {/* Production Path Settings */}
      {!import.meta.env.DEV && (
        <section style={{ marginBottom: 'var(--iris-space-xl)' }}>
          <h2 style={{
            fontSize: 'var(--iris-font-size-lg)',
            fontWeight: '500',
            margin: '0 0 var(--iris-space-md) 0',
            color: 'var(--iris-text)',
            borderBottom: '1px solid var(--iris-border)',
            paddingBottom: 'var(--iris-space-sm)'
          }}>
            Custom Paths
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
                Custom Config Directory
              </div>
              <div style={{
                fontSize: 'var(--iris-font-size-sm)',
                color: 'var(--iris-text-muted)',
                marginBottom: 'var(--iris-space-sm)'
              }}>
                Override the default config directory (default: ~/.config/irisnotes/)
              </div>
              <input
                type="text"
                value={config.production.customConfigPath || ''}
                onChange={(e) => handleCustomConfigPathChange(e.target.value)}
                placeholder="~/.config/irisnotes/"
                style={{
                  padding: 'var(--iris-space-sm)',
                  border: '1px solid var(--iris-border)',
                  borderRadius: '4px',
                  background: 'var(--iris-bg-primary)',
                  color: 'var(--iris-text)',
                  width: '400px',
                  fontFamily: 'monospace'
                }}
              />
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
                Custom Database Path
              </div>
              <div style={{
                fontSize: 'var(--iris-font-size-sm)',
                color: 'var(--iris-text-muted)',
                marginBottom: 'var(--iris-space-sm)'
              }}>
                Override the default database file location
              </div>
              <input
                type="text"
                value={config.production.customDatabasePath || ''}
                onChange={(e) => handleCustomDatabasePathChange(e.target.value)}
                placeholder="~/.config/irisnotes/notes.db"
                style={{
                  padding: 'var(--iris-space-sm)',
                  border: '1px solid var(--iris-border)',
                  borderRadius: '4px',
                  background: 'var(--iris-bg-primary)',
                  color: 'var(--iris-text)',
                  width: '400px',
                  fontFamily: 'monospace'
                }}
              />
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
                Custom Notes Directory
              </div>
              <div style={{
                fontSize: 'var(--iris-font-size-sm)',
                color: 'var(--iris-text-muted)',
                marginBottom: 'var(--iris-space-sm)'
              }}>
                Override the default notes directory for file-system backend
              </div>
              <input
                type="text"
                value={config.production.customNotesPath || ''}
                onChange={(e) => handleCustomNotesPathChange(e.target.value)}
                placeholder="~/.config/irisnotes/notes/"
                style={{
                  padding: 'var(--iris-space-sm)',
                  border: '1px solid var(--iris-border)',
                  borderRadius: '4px',
                  background: 'var(--iris-bg-primary)',
                  color: 'var(--iris-text)',
                  width: '400px',
                  fontFamily: 'monospace'
                }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Development Mode Notice */}
      {import.meta.env.DEV && (
        <section style={{ marginBottom: 'var(--iris-space-xl)' }}>
          <div style={{
            padding: 'var(--iris-space-md)',
            border: '1px solid #faad14',
            borderRadius: '6px',
            background: '#fffbe6',
            color: '#d48806'
          }}>
            <div style={{
              fontWeight: '500',
              marginBottom: 'var(--iris-space-xs)'
            }}>
              Development Mode
            </div>
                         <div style={{ fontSize: 'var(--iris-font-size-sm)' }}>
               Running in development mode with local config directory: <code>./dev/config/</code>
             </div>
          </div>
        </section>
      )}

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