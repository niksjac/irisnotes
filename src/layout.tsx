import type React from "react";
import { ActivityBar, SidebarResizer, Sidebar, DualPaneView } from "@/components";
import { useLayout, useAppHotkeys } from "@/hooks";
import { Content } from "./content";

export const Layout: React.FC = () => {
	const { sidebar, panes, views } = useLayout();

	// Centralized app hotkeys
	useAppHotkeys({
		onToggleSidebar: sidebar.toggle,
		onToggleDualPane: panes.toggleDualMode,
		onToggleActivityBar: views.toggleActivityBar,
	});

	return (
		<div className="flex flex-col h-screen w-screen">
			<div className="flex-1 overflow-hidden">
				<div className="overflow-hidden h-full flex md:flex-row flex-col __3">
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
					<div className="flex-1 flex flex-col overflow-hidden __4">
						{panes.isDualMode ? <DualPaneView panes={panes} /> : <Content />}
					</div>
				</div>
			</div>
		</div>
	);
};
