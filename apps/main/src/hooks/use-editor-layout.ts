import { useAtom } from "jotai";
import { useCallback, useRef } from "react";
import { toolbarVisibleAtom, titleBarVisibleAtom } from "@/atoms";
import { useConfig } from "@/hooks/use-config";

// Module-level state to track pending saves
let pendingSaveTimeout: ReturnType<typeof setTimeout> | null = null;
let pendingToolbar: boolean | null = null;
let pendingTitleBar: boolean | null = null;

export const useEditorLayout = () => {
	const { config, updateConfig } = useConfig();
	const [toolbarVisible, setToolbarVisible] = useAtom(toolbarVisibleAtom);
	const [titleBarVisible, setTitleBarVisible] = useAtom(titleBarVisibleAtom);
	
	// Keep refs to current config for use in timeout
	const configRef = useRef(config);
	configRef.current = config;

	// Note: Initial values come from localStorage (in atoms/index.ts)
	// Config file is used for backup/sync but not as primary source

	// Shared save function that batches pending changes
	const scheduleSave = useCallback(() => {
		if (pendingSaveTimeout) {
			clearTimeout(pendingSaveTimeout);
		}
		pendingSaveTimeout = setTimeout(() => {
			const currentConfig = configRef.current;
			const changes: Record<string, boolean> = {};
			
			if (pendingToolbar !== null) {
				changes.toolbarVisible = pendingToolbar;
				pendingToolbar = null;
			}
			if (pendingTitleBar !== null) {
				changes.titleBarVisible = pendingTitleBar;
				pendingTitleBar = null;
			}
			
			if (Object.keys(changes).length > 0) {
				void updateConfig({
					editor: {
						...currentConfig.editor,
						...changes,
					},
				});
			}
			pendingSaveTimeout = null;
		}, 100);
	}, [updateConfig]);

	const toggleToolbar = useCallback(() => {
		const newVisibility = !toolbarVisible;
		setToolbarVisible(newVisibility);
		pendingToolbar = newVisibility;
		scheduleSave();
	}, [toolbarVisible, setToolbarVisible, scheduleSave]);

	const toggleTitleBar = useCallback(() => {
		const newVisibility = !titleBarVisible;
		setTitleBarVisible(newVisibility);
		pendingTitleBar = newVisibility;
		scheduleSave();
	}, [titleBarVisible, setTitleBarVisible, scheduleSave]);

	return {
		toolbarVisible,
		toggleToolbar,
		titleBarVisible,
		toggleTitleBar,
	};
};
