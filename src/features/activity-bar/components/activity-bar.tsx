import clsx from "clsx";
import "./activity-bar.css";

interface ActivityBarProps {
  isVisible: boolean;
  selectedView: string;
  onViewChange: (view: string) => void;
  isDualPaneMode?: boolean;
  onToggleDualPane?: () => void;
  isLineWrapping?: boolean;
  onToggleLineWrapping?: () => void;
}

export function ActivityBar({
  isVisible,
  selectedView,
  onViewChange,
  isDualPaneMode = false,
  onToggleDualPane,
  isLineWrapping = false,
  onToggleLineWrapping
}: ActivityBarProps) {
  const activities = [
    { id: "1", label: "Section 1" },
    { id: "2", label: "Section 2" },
    { id: "3", label: "Section 3" },
    { id: "4", label: "Section 4" },
  ];

  if (!isVisible) return null;

  return (
    <div className="activity-bar">
      <div className="activity-bar-content">
        <div className="activity-bar-items">
          {activities.map((activity) => (
            <button
              key={activity.id}
              className={clsx("activity-bar-item", {
                active: selectedView === activity.id,
              })}
              onClick={() => onViewChange(activity.id)}
              title={activity.label}
            >
              {activity.id}
            </button>
          ))}
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