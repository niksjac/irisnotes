import type React from "react";
import { ActivityBar, SidebarResizer, Sidebar, PaneContainer } from "@/components";
import { useLayout, useAppHotkeys, useHotkeyHandlers } from "@/hooks";
import { mapHotkeyHandlers } from "@/utils/hotkey-mapping";

export const Layout: React.FC = () => {
	const { sidebar, views } = useLayout();
	const hotkeyHandlers = useHotkeyHandlers();

	// Fixed hotkey setup with proper name mapping
	useAppHotkeys(mapHotkeyHandlers(sidebar, views, hotkeyHandlers));

	return (
		<div className="flex flex-col h-screen w-screen">
			<div className="flex-1 overflow-hidden">
				{/* Responsive layout using CSS-only approach */}
				<div className="overflow-hidden h-full flex flex-col md:flex-row">
					{/* Activity Bar */}
					<ActivityBar />

					{/* Resizable Sidebar */}
					<SidebarResizer
						isCollapsed={sidebar.collapsed}
						onCollapsedChange={sidebar.setCollapsed}
						minWidth={200}
						maxWidth={600}
						defaultWidth={300}
						autoCollapseOnResize={false}
					>
						<Sidebar />
					</SidebarResizer>

					{/* Main Content Area */}
					<div className="flex-1 flex flex-col overflow-hidden">
						<PaneContainer />
					</div>
				</div>
			</div>
		</div>
	);
};
