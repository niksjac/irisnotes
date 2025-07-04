import { useState, useEffect } from 'react';
import { useMultiStorageNotes } from '../../notes';

interface DatabaseInfo {
  backend: string;
  note_count: number;
  last_sync?: string;
  storage_size?: number;
}

export function DatabaseStatusView() {
  const { storageManager, notes, isLoading, error } = useMultiStorageNotes();
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDatabaseInfo = async () => {
    if (!storageManager) return;

    setRefreshing(true);
    try {
      const defaultStorage = storageManager.getDefaultStorage();
      if (defaultStorage) {
        const result = await defaultStorage.getStorageInfo();
        if (result.success && result.data) {
          setDatabaseInfo(result.data);
        }
      }
    } catch (err) {
      console.error('Failed to load database info:', err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDatabaseInfo();
  }, [storageManager]);

  const formatBytes = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = () => {
    if (error) return '#e74c3c'; // Red for error
    if (isLoading || refreshing) return '#f39c12'; // Orange for loading
    return '#27ae60'; // Green for healthy
  };

  const getStatusText = () => {
    if (error) return 'Error';
    if (isLoading || refreshing) return 'Loading...';
    return 'Healthy';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '60px',
      right: '20px',
      width: '300px',
      maxHeight: '80vh',
      background: 'var(--iris-bg-primary)',
      border: '1px solid var(--iris-border)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 1000,
      overflow: 'auto'
    }}>
      {/* Header */}
      <div style={{
        padding: 'var(--iris-space-md)',
        borderBottom: '1px solid var(--iris-border)',
        background: 'var(--iris-bg-secondary)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: 'var(--iris-font-size-md)',
            fontWeight: '600',
            color: 'var(--iris-text)'
          }}>
            Database Status
          </h3>
          <button
            onClick={loadDatabaseInfo}
            disabled={refreshing}
            style={{
              padding: '4px 8px',
              fontSize: 'var(--iris-font-size-xs)',
              border: '1px solid var(--iris-border)',
              borderRadius: '4px',
              background: 'var(--iris-bg-primary)',
              color: 'var(--iris-text)',
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.6 : 1
            }}
          >
            {refreshing ? '...' : '↻'}
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      <div style={{
        padding: 'var(--iris-space-md)',
        borderBottom: '1px solid var(--iris-border)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--iris-space-sm)'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: getStatusColor()
          }} />
          <span style={{
            fontWeight: '500',
            color: 'var(--iris-text)',
            fontSize: 'var(--iris-font-size-sm)'
          }}>
            {getStatusText()}
          </span>
        </div>
        {error && (
          <div style={{
            marginTop: 'var(--iris-space-xs)',
            padding: 'var(--iris-space-sm)',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '4px',
            color: '#dc2626',
            fontSize: 'var(--iris-font-size-xs)'
          }}>
            {error}
          </div>
        )}
      </div>

      {/* Database Information */}
      <div style={{ padding: 'var(--iris-space-md)' }}>
        <div style={{
          display: 'grid',
          gap: 'var(--iris-space-md)'
        }}>
          {/* Backend Type */}
          <div>
            <div style={{
              fontSize: 'var(--iris-font-size-xs)',
              fontWeight: '500',
              color: 'var(--iris-text-muted)',
              marginBottom: '2px'
            }}>
              Backend
            </div>
            <div style={{
              fontSize: 'var(--iris-font-size-sm)',
              color: 'var(--iris-text)',
              fontFamily: 'monospace'
            }}>
              {databaseInfo?.backend || 'Unknown'}
            </div>
          </div>

          {/* Notes Count */}
          <div>
            <div style={{
              fontSize: 'var(--iris-font-size-xs)',
              fontWeight: '500',
              color: 'var(--iris-text-muted)',
              marginBottom: '2px'
            }}>
              Total Notes
            </div>
            <div style={{
              fontSize: 'var(--iris-font-size-sm)',
              color: 'var(--iris-text)',
              fontWeight: '500'
            }}>
              {databaseInfo?.note_count ?? notes.length}
            </div>
          </div>

          {/* Storage Size */}
          <div>
            <div style={{
              fontSize: 'var(--iris-font-size-xs)',
              fontWeight: '500',
              color: 'var(--iris-text-muted)',
              marginBottom: '2px'
            }}>
              Storage Size
            </div>
            <div style={{
              fontSize: 'var(--iris-font-size-sm)',
              color: 'var(--iris-text)'
            }}>
              {formatBytes(databaseInfo?.storage_size)}
            </div>
          </div>

          {/* Last Sync */}
          <div>
            <div style={{
              fontSize: 'var(--iris-font-size-xs)',
              fontWeight: '500',
              color: 'var(--iris-text-muted)',
              marginBottom: '2px'
            }}>
              Last Sync
            </div>
            <div style={{
              fontSize: 'var(--iris-font-size-sm)',
              color: 'var(--iris-text)'
            }}>
              {formatDate(databaseInfo?.last_sync)}
            </div>
          </div>

          {/* Available Storages */}
          <div>
            <div style={{
              fontSize: 'var(--iris-font-size-xs)',
              fontWeight: '500',
              color: 'var(--iris-text-muted)',
              marginBottom: '2px'
            }}>
              Available Storages
            </div>
            <div style={{
              fontSize: 'var(--iris-font-size-sm)',
              color: 'var(--iris-text)'
            }}>
              {storageManager?.getStorages().join(', ') || 'None'}
            </div>
          </div>

          {/* Connection Status */}
          <div>
            <div style={{
              fontSize: 'var(--iris-font-size-xs)',
              fontWeight: '500',
              color: 'var(--iris-text-muted)',
              marginBottom: '2px'
            }}>
              Connection
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--iris-space-xs)'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: storageManager ? '#27ae60' : '#e74c3c'
              }} />
              <span style={{
                fontSize: 'var(--iris-font-size-sm)',
                color: 'var(--iris-text)'
              }}>
                {storageManager ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{
          marginTop: 'var(--iris-space-lg)',
          paddingTop: 'var(--iris-space-md)',
          borderTop: '1px solid var(--iris-border)'
        }}>
          <div style={{
            display: 'grid',
            gap: 'var(--iris-space-sm)'
          }}>
            <button
              onClick={loadDatabaseInfo}
              disabled={refreshing}
              style={{
                padding: 'var(--iris-space-sm)',
                fontSize: 'var(--iris-font-size-xs)',
                border: '1px solid var(--iris-border)',
                borderRadius: '4px',
                background: 'var(--iris-bg-secondary)',
                color: 'var(--iris-text)',
                cursor: refreshing ? 'not-allowed' : 'pointer',
                opacity: refreshing ? 0.6 : 1
              }}
            >
              Refresh Status
            </button>

            {storageManager?.syncAllStorages && (
              <button
                onClick={() => storageManager.syncAllStorages()}
                disabled={refreshing}
                style={{
                  padding: 'var(--iris-space-sm)',
                  fontSize: 'var(--iris-font-size-xs)',
                  border: '1px solid var(--iris-accent)',
                  borderRadius: '4px',
                  background: 'var(--iris-accent)',
                  color: 'white',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  opacity: refreshing ? 0.6 : 1
                }}
              >
                Sync All Storages
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}