import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { sidebarCollapsed } from '@/atoms';

export const useSidebar = () => {
	const [sidebarCollapsedValue, setSidebarCollapsed] = useAtom(sidebarCollapsed);

	const toggleSidebar = useCallback(() => {
		setSidebarCollapsed(!sidebarCollapsedValue);
	}, [sidebarCollapsedValue, setSidebarCollapsed]);

	const handleSidebarCollapsedChange = useCallback(
		(collapsed: boolean) => {
			setSidebarCollapsed(collapsed);
		},
		[setSidebarCollapsed]
	);

	return {
		// State
		sidebarCollapsed: sidebarCollapsedValue,
		setSidebarCollapsed,
		// Actions
		toggleSidebar,
		handleSidebarCollapsedChange,
	};
};
