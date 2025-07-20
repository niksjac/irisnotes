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
import { useSidebarState, useSidebarActions } from "../../layout/hooks";
import { useViewState, useViewActions } from "../../layout/hooks";
import { usePaneState, usePaneActions } from "../../layout/hooks";
import { useEditorState, useEditorActions } from "../../editor";
import { useEditorLayout } from "../../layout/hooks";
import { useActivityBarFocus } from "../hooks";

// ActivityBar now has zero props - manages everything internally
interface ActivityBarProps {}

export function ActivityBar({}: ActivityBarProps) {
  const activityBarRef = useRef<HTMLDivElement>(null);

  // Direct hook access - no prop drilling
  const { sidebarCollapsed } = useSidebarState();
  const { activityBarVisible, configViewActive, hotkeysViewActive, databaseStatusVisible } = useViewState();
  const { isDualPaneMode } = usePaneState();

  const { toggleSidebar } = useSidebarActions();
  const { toggleConfigView, toggleHotkeysView, toggleDatabaseStatus } = useViewActions();
  const { toggleDualPaneMode } = usePaneActions();
  const { toolbarVisible, toggleToolbar } = useEditorLayout();

  const { isWrapping, fontSize } = useEditorState();
  const { toggleLineWrapping } = useEditorActions();

  // Focus management via dedicated hook
  const { focusClasses, registerElement, setFocusFromClick } = useActivityBarFocus();

  // Register with focus management
  useEffect(() => {
    if (registerElement && activityBarRef.current) {
      registerElement(activityBarRef.current);
    }
  }, [registerElement]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (setFocusFromClick) {
      setFocusFromClick();
    }
  };

  if (!activityBarVisible) return null;

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
            onClick={toggleSidebar}
            title="Toggle Notes Sidebar"
          >
            <FileText size={20} />
          </button>

          <button
            className={clsx("flex items-center justify-center w-6 h-6 border-none rounded-none bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 text-lg font-semibold p-0 hover:bg-transparent hover:text-gray-900 dark:hover:text-gray-100 hover:scale-110", {
              "bg-transparent text-blue-500 scale-110": configViewActive,
            })}
            onClick={toggleConfigView}
            title="Configuration"
          >
            <Settings size={20} />
          </button>

          <button
            className={clsx("flex items-center justify-center w-6 h-6 border-none rounded-none bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 text-lg font-semibold p-0 hover:bg-transparent hover:text-gray-900 dark:hover:text-gray-100 hover:scale-110", {
              "bg-transparent text-blue-500 scale-110": hotkeysViewActive,
            })}
            onClick={toggleHotkeysView}
            title="Hotkeys Reference"
          >
            <Keyboard size={20} />
          </button>

          <button
            className={clsx("flex items-center justify-center w-6 h-6 border-none rounded-none bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 text-lg font-semibold p-0 hover:bg-transparent hover:text-gray-900 dark:hover:text-gray-100 hover:scale-110", {
              "bg-transparent text-blue-500 scale-110": databaseStatusVisible,
            })}
            onClick={toggleDatabaseStatus}
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

          <button
            className={clsx("flex items-center justify-center w-6 h-6 border-none rounded-none bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 text-lg font-semibold p-0 hover:bg-transparent hover:text-gray-900 dark:hover:text-gray-100 hover:scale-110", {
              "bg-transparent text-blue-500 scale-110": toolbarVisible,
            })}
            onClick={toggleToolbar}
            title={`${toolbarVisible ? 'Hide' : 'Show'} editor toolbar`}
          >
            <Wrench size={20} />
          </button>

          <button
            className={clsx("flex items-center justify-center w-6 h-6 border-none rounded-none bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 text-lg font-semibold p-0 hover:bg-transparent hover:text-gray-900 dark:hover:text-gray-100 hover:scale-110", {
              "bg-transparent text-blue-500 scale-110": isWrapping,
            })}
            onClick={toggleLineWrapping}
            title={`${isWrapping ? 'Disable' : 'Enable'} line wrapping (Ctrl+Alt+W)`}
          >
            {isWrapping ? <WrapText size={20} /> : <ArrowRight size={20} />}
          </button>

          <button
            className={clsx("flex items-center justify-center w-6 h-6 border-none rounded-none bg-transparent text-gray-600 dark:text-gray-400 cursor-pointer transition-all duration-200 p-0 hover:bg-transparent hover:text-gray-900 dark:hover:text-gray-100 hover:scale-110", {
              "bg-transparent text-blue-500 scale-110": isDualPaneMode,
            })}
            onClick={toggleDualPaneMode}
            title={`${isDualPaneMode ? 'Disable' : 'Enable'} dual-pane mode (Ctrl+D)`}
          >
            {isDualPaneMode ? <PanelRightOpen size={20} /> : <PanelRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}