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
      className={clsx("w-9 bg-gray-200 dark:bg-gray-700 border-r border-gray-300 dark:border-gray-600 flex-shrink-0 flex flex-col", focusClasses)}
      tabIndex={0}
      onClick={handleClick}
    >
      <div className="flex flex-col h-full items-center py-1">
        <div className="flex flex-col gap-2 py-1 items-center">
          <button
            className={clsx("flex items-center justify-center w-6 h-6 border-none rounded-none bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 text-lg font-semibold p-0 hover:bg-transparent hover:text-gray-900 dark:hover:text-gray-100 hover:scale-110", {
              "bg-transparent text-blue-500 scale-110": !sidebarCollapsed,
            })}
            onClick={onToggleSidebar}
            title="Toggle Notes Sidebar"
          >
            <FileText size={20} />
          </button>

          <button
            className={clsx("flex items-center justify-center w-6 h-6 border-none rounded-none bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 text-lg font-semibold p-0 hover:bg-transparent hover:text-gray-900 dark:hover:text-gray-100 hover:scale-110", {
              "bg-transparent text-blue-500 scale-110": configViewActive,
            })}
            onClick={onToggleConfigView}
            title="Configuration"
          >
            <Settings size={20} />
          </button>

          <button
            className={clsx("flex items-center justify-center w-6 h-6 border-none rounded-none bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 text-lg font-semibold p-0 hover:bg-transparent hover:text-gray-900 dark:hover:text-gray-100 hover:scale-110", {
              "bg-transparent text-blue-500 scale-110": hotkeysViewActive,
            })}
            onClick={onToggleHotkeysView}
            title="Hotkeys Reference"
          >
            <Keyboard size={20} />
          </button>

          <button
            className={clsx("flex items-center justify-center w-6 h-6 border-none rounded-none bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 text-lg font-semibold p-0 hover:bg-transparent hover:text-gray-900 dark:hover:text-gray-100 hover:scale-110", {
              "bg-transparent text-blue-500 scale-110": databaseStatusVisible,
            })}
            onClick={onToggleDatabaseStatus}
            title="Database Status"
          >
            <Database size={20} />
          </button>
        </div>

        <div className="mt-auto pt-2 border-t border-gray-300 dark:border-gray-600 flex flex-col gap-2 pl-0 pr-0 pb-1 items-center">
          {/* Font Size Indicator */}
          <div
            className="flex flex-col items-center justify-center gap-0.5 cursor-default text-gray-700 dark:text-gray-300 text-xs font-medium p-0.5 h-8"
            title={`Editor font size: ${fontSize}px (Ctrl+Plus/Minus to adjust)`}
          >
            <Type size={12} />
            <span>{fontSize}px</span>
          </div>

          {onToggleToolbar && (
            <button
              className={clsx("flex items-center justify-center w-6 h-6 border-none rounded-none bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 text-lg font-semibold p-0 hover:bg-transparent hover:text-gray-900 dark:hover:text-gray-100 hover:scale-110", {
                "bg-transparent text-blue-500 scale-110": isToolbarVisible,
              })}
              onClick={onToggleToolbar}
              title={`${isToolbarVisible ? 'Hide' : 'Show'} editor toolbar`}
            >
              <Wrench size={20} />
            </button>
          )}

          {onToggleLineWrapping && (
            <button
              className={clsx("flex items-center justify-center w-6 h-6 border-none rounded-none bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 text-lg font-semibold p-0 hover:bg-transparent hover:text-gray-900 dark:hover:text-gray-100 hover:scale-110", {
                "bg-transparent text-blue-500 scale-110": isLineWrapping,
              })}
              onClick={onToggleLineWrapping}
              title={`${isLineWrapping ? 'Disable' : 'Enable'} line wrapping (Ctrl+Alt+W)`}
            >
              {isLineWrapping ? <WrapText size={20} /> : <ArrowRight size={20} />}
            </button>
          )}

          {onToggleDualPane && (
            <button
              className={clsx("flex items-center justify-center w-6 h-6 border-none rounded-none bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 p-0 hover:bg-transparent hover:text-gray-900 dark:hover:text-gray-100 hover:scale-110", {
                "bg-transparent text-blue-500 scale-110": isDualPaneMode,
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