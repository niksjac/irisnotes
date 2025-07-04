import clsx from "clsx";
import "./activity-bar.css";

interface ActivityBarProps {
  isVisible: boolean;
  sidebarCollapsed: boolean;
  configViewActive: boolean;
  hotkeysViewActive: boolean;
  databaseStatusVisible: boolean;
  onToggleSidebar: () => void;
  onToggleConfigView: () => void;
  onToggleHotkeysView: () => void;
  onToggleDatabaseStatus: () => void;
  isDualPaneMode?: boolean;
  onToggleDualPane?: () => void;
  isLineWrapping?: boolean;
  onToggleLineWrapping?: () => void;
}

export function ActivityBar({
  isVisible,
  sidebarCollapsed,
  configViewActive,
  hotkeysViewActive,
  databaseStatusVisible,
  onToggleSidebar,
  onToggleConfigView,
  onToggleHotkeysView,
  onToggleDatabaseStatus,
  isDualPaneMode = false,
  onToggleDualPane,
  isLineWrapping = false,
  onToggleLineWrapping
}: ActivityBarProps) {
  if (!isVisible) return null;

  return (
    <div className="activity-bar">
      <div className="activity-bar-content">
        <div className="activity-bar-items">
          <button
            className={clsx("activity-bar-item", {
              active: !sidebarCollapsed,
            })}
            onClick={onToggleSidebar}
            title="Toggle Notes Sidebar"
          >
            📝
          </button>

          <button
            className={clsx("activity-bar-item", {
              active: configViewActive,
            })}
            onClick={onToggleConfigView}
            title="Configuration"
          >
            ⚙️
          </button>

          <button
            className={clsx("activity-bar-item", {
              active: hotkeysViewActive,
            })}
            onClick={onToggleHotkeysView}
            title="Hotkeys Reference"
          >
            ⌨️
          </button>

          <button
            className={clsx("activity-bar-item", {
              active: databaseStatusVisible,
            })}
            onClick={onToggleDatabaseStatus}
            title="Database Status"
          >
            🗄️
          </button>
        </div>

        <div className="activity-bar-separator">
          {onToggleLineWrapping && (
            <button
              className={clsx("activity-bar-item", {
                active: isLineWrapping,
              })}
              onClick={onToggleLineWrapping}
              title={`${isLineWrapping ? 'Disable' : 'Enable'} line wrapping (Ctrl+Alt+W)`}
            >
              {isLineWrapping ? '↲' : '→'}
            </button>
          )}

          {onToggleDualPane && (
            <button
              className={clsx("activity-bar-item dual-pane-toggle", {
                active: isDualPaneMode,
              })}
              onClick={onToggleDualPane}
              title={`${isDualPaneMode ? 'Disable' : 'Enable'} dual-pane mode (Ctrl+D)`}
            >
              {isDualPaneMode ? '⚏' : '⚌'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}