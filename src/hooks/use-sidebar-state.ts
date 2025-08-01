import { useAtom } from 'jotai';
import { sidebarCollapsed } from '@/atoms';

export const useSidebarState = () => {
	const [sidebarCollapsedValue, setSidebarCollapsed] = useAtom(sidebarCollapsed);

	return {
		sidebarCollapsed: sidebarCollapsedValue,
		setSidebarCollapsed,
	};
};
