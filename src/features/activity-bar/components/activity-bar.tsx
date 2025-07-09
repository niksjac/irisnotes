import { useRef, useEffect } from "react";
import clsx from "clsx";
import {
  FileText,
  Settings,
  Keyboard,
  Database,
  Wrench,
  WrapText,
  ArrowRight,
  PanelRight,
  PanelRightOpen,
  Type
} from "lucide-react";
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
  isToolbarVisible?: boolean;
  onToggleToolbar?: () => void;
  fontSize?: number; // Current editor font size
  // Focus management props
  focusClasses?: Record<string, boolean>;
  onRegisterElement?: (ref: HTMLElement | null) => void;
  onSetFocusFromClick?: () => void;
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
  onToggleLineWrapping,
  isToolbarVisible = true,
  onToggleToolbar,
  fontSize = 14,
  focusClasses = {},
  onRegisterElement,
  onSetFocusFromClick
}: ActivityBarProps) {
  const activityBarRef = useRef<HTMLDivElement>(null);

  // Register with focus management
  useEffect(() => {
    if (onRegisterElement && activityBarRef.current) {
      onRegisterElement(activityBarRef.current);
    }
  }, [onRegisterElement]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSetFocusFromClick) {
      onSetFocusFromClick();
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={activityBarRef}
      className={clsx("activity-bar", focusClasses)}
      tabIndex={0}
      onClick={handleClick}
    >
      <div className="activity-bar-content">
        <div className="activity-bar-items">
          <button
            className={clsx("activity-bar-item", {
              active: !sidebarCollapsed,
            })}
            onClick={onToggleSidebar}
            title="Toggle Notes Sidebar"
          >
            <FileText size={20} />
          </button>

          <button
            className={clsx("activity-bar-item", {
              active: configViewActive,
            })}
            onClick={onToggleConfigView}
            title="Configuration"
          >
            <Settings size={20} />
          </button>

          <button
            className={clsx("activity-bar-item", {
              active: hotkeysViewActive,
            })}
            onClick={onToggleHotkeysView}
            title="Hotkeys Reference"
          >
            <Keyboard size={20} />
          </button>

          <button
            className={clsx("activity-bar-item", {
              active: databaseStatusVisible,
            })}
            onClick={onToggleDatabaseStatus}
            title="Database Status"
          >
            <Database size={20} />
          </button>
        </div>

        <div className="activity-bar-separator">
          {/* Font Size Indicator */}
          <div
            className="activity-bar-item font-size-indicator"
            title={`Editor font size: ${fontSize}px (Ctrl+Plus/Minus to adjust)`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              cursor: 'default',
              color: 'var(--iris-text-2)',
              fontSize: '10px',
              fontWeight: '500',
              padding: '2px',
              height: '32px'
            }}
          >
            <Type size={12} />
            <span>{fontSize}px</span>
          </div>

          {onToggleToolbar && (
            <button
              className={clsx("activity-bar-item", {
                active: isToolbarVisible,
              })}
              onClick={onToggleToolbar}
              title={`${isToolbarVisible ? 'Hide' : 'Show'} editor toolbar`}
            >
              <Wrench size={20} />
            </button>
          )}

          {onToggleLineWrapping && (
            <button
              className={clsx("activity-bar-item", {
                active: isLineWrapping,
              })}
              onClick={onToggleLineWrapping}
              title={`${isLineWrapping ? 'Disable' : 'Enable'} line wrapping (Ctrl+Alt+W)`}
            >
              {isLineWrapping ? <WrapText size={20} /> : <ArrowRight size={20} />}
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
              {isDualPaneMode ? <PanelRightOpen size={20} /> : <PanelRight size={20} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}