import type { FC } from "react";
import type { ViewType } from "@/types";
import { ConfigView, HotkeysView, FolderView, EditorRichView, EditorSourceView, WelcomeView } from "@/views";

interface ViewRendererProps {
	viewType: ViewType;
	viewData?: any;
}

export const ViewRenderer: FC<ViewRendererProps> = ({ viewType }) => {
	const viewMapping: Record<ViewType, React.ReactElement> = {
		"config-view": <ConfigView />,
		"hotkeys-view": <HotkeysView />,
		"folder-view": <FolderView />,
		"editor-rich-view": <EditorRichView />,
		"editor-source-view": <EditorSourceView />,
		"welcome-view": <WelcomeView />,
	};

	return viewMapping[viewType];
};
