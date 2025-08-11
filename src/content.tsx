import type { FC } from "react";
import type { ViewType } from "@/types";
import { useAtomValue } from "jotai";
import { currentViewAtom } from "@/atoms";
import { ConfigView, HotkeysView, FolderView, EditorRichView, EditorSourceView, WelcomeView } from "@/views";

export const Content: FC = () => {
	const currentView = useAtomValue(currentViewAtom);

	const viewMapping: Record<ViewType, React.ReactElement> = {
		"config-view": <ConfigView />,
		"hotkeys-view": <HotkeysView />,
		"folder-view": <FolderView />,
		"editor-rich-view": <EditorRichView />,
		"editor-source-view": <EditorSourceView />,
		"welcome-view": <WelcomeView />,
	};

	return viewMapping[currentView];
};
