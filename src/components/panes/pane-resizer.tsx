import type { FC } from "react";
import { useState, useCallback } from "react";

interface PaneResizerProps {
	onResize?: (leftWidth: number, rightWidth: number) => void;
	initialLeftWidth?: number;
	minWidth?: number;
	maxWidth?: number;
}

export const PaneResizer: FC<PaneResizerProps> = ({
	onResize,
	minWidth = 200,
	maxWidth = 80 // percentage
}) => {
	const [isResizing, setIsResizing] = useState(false);

	const handleMouseDown = useCallback((e: React.MouseEvent) => {
		e.preventDefault();
		setIsResizing(true);

		const handleMouseMove = (e: MouseEvent) => {
			const container = (e.target as HTMLElement).closest('.pane-container');
			if (!container) return;

			const rect = container.getBoundingClientRect();
			const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;

			// Apply constraints
			const constrainedWidth = Math.max(
				(minWidth / rect.width) * 100,
				Math.min(maxWidth, newLeftWidth)
			);

			if (onResize) {
				onResize(constrainedWidth, 100 - constrainedWidth);
			}

			// Update CSS custom properties for the panes
			document.documentElement.style.setProperty('--pane-left-width', `${constrainedWidth}%`);
			document.documentElement.style.setProperty('--pane-right-width', `${100 - constrainedWidth}%`);
		};

		const handleMouseUp = () => {
			setIsResizing(false);
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseup', handleMouseUp);
		};

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseup', handleMouseUp);
	}, [onResize, minWidth, maxWidth]);

	return (
		<div
			className={`
				w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize flex-shrink-0
				${isResizing ? 'bg-blue-500' : ''}
			`}
			onMouseDown={handleMouseDown}
		>
			<div className="w-full h-full" />
		</div>
	);
};
