import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import type { ContextMenuData, MenuItem } from "@/types/context-menu";

interface ContextMenuProps {
	data: ContextMenuData | null;
	onClose: () => void;
}

export function ContextMenu({ data, onClose }: ContextMenuProps) {
	const menuRef = useRef<HTMLDivElement>(null);
	const [adjustedPosition, setAdjustedPosition] = useState({ x: 0, y: 0 });

	// Adjust menu position to keep it within viewport
	useEffect(() => {
		if (!data || !menuRef.current) return;

		const menu = menuRef.current;
		const rect = menu.getBoundingClientRect();
		const viewport = {
			width: window.innerWidth,
			height: window.innerHeight,
		};

		let { x, y } = data.position;

		// Adjust horizontal position
		if (x + rect.width > viewport.width) {
			x = viewport.width - rect.width - 8; // 8px margin
		}

		// Adjust vertical position
		if (y + rect.height > viewport.height) {
			y = viewport.height - rect.height - 8; // 8px margin
		}

		// Ensure minimum margins
		x = Math.max(8, x);
		y = Math.max(8, y);

		setAdjustedPosition({ x, y });
	}, [data]);

	const handleMenuItemClick = (item: MenuItem) => {
		if (!item.disabled) {
			item.action();
			onClose();
		}
	};

	if (!data) return null;

	const menuContent = (
		<div
			ref={menuRef}
			className="fixed z-50 min-w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
			style={{
				left: adjustedPosition.x,
				top: adjustedPosition.y,
			}}
			onClick={(e) => e.stopPropagation()}
		>
			{data.menuGroups.map((group, groupIndex) => (
				<div key={group.id}>
					{groupIndex > 0 && <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />}
					{group.items.map((item) => {
						if (item.separator) {
							return <div key={item.id} className="h-px bg-gray-200 dark:bg-gray-700 my-1" />;
						}

						return (
							<button
								key={item.id}
								className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
									item.disabled
										? "text-gray-400 dark:text-gray-500 cursor-not-allowed"
										: "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
								}`}
								onClick={() => handleMenuItemClick(item)}
								disabled={item.disabled}
							>
								{item.icon && <item.icon className="h-4 w-4" />}
								<span className="flex-1">{item.label}</span>
								{item.shortcut && <span className="text-xs text-gray-400 dark:text-gray-500">{item.shortcut}</span>}
							</button>
						);
					})}
				</div>
			))}
		</div>
	);

	return createPortal(menuContent, document.body);
}
