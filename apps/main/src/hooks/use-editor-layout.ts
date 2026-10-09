import { useAtom } from "jotai";
import { useCallback } from "react";
import { metadataBarVisibleAtom, toolbarVisibleAtom, titleBarVisibleAtom } from "@/atoms";

// Visibility is persisted to localStorage by useLayoutPersistence.
export const useEditorLayout = () => {
	const [toolbarVisible, setToolbarVisible] = useAtom(toolbarVisibleAtom);
	const [titleBarVisible, setTitleBarVisible] = useAtom(titleBarVisibleAtom);
	const [metadataBarVisible, setMetadataBarVisible] = useAtom(metadataBarVisibleAtom);

	const toggleToolbar = useCallback(() => {
		setToolbarVisible(!toolbarVisible);
	}, [toolbarVisible, setToolbarVisible]);

	const toggleTitleBar = useCallback(() => {
		setTitleBarVisible(!titleBarVisible);
	}, [titleBarVisible, setTitleBarVisible]);

	const toggleMetadataBar = useCallback(() => {
		setMetadataBarVisible(!metadataBarVisible);
	}, [metadataBarVisible, setMetadataBarVisible]);

	return {
		toolbarVisible,
		toggleToolbar,
		titleBarVisible,
		toggleTitleBar,
		metadataBarVisible,
		toggleMetadataBar,
	};
};
