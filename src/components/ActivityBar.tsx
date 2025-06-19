import clsx from "clsx";

interface ActivityBarProps {
  isVisible: boolean;
  selectedView: string;
  onViewChange: (view: string) => void;
}

export function ActivityBar({ isVisible, selectedView, onViewChange }: ActivityBarProps) {
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


      </div>
    </div>
  );
}