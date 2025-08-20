import type { FC } from "react";
import type { ViewType } from "@/types";
import { ConfigView, HotkeysView, EditorRichView, EditorSourceView, EmptyView } from "@/views";

interface ViewProps {
	viewType: ViewType;
	viewData?: any;
}

export const View: FC<ViewProps> = ({ viewType }) => {
	const viewMapping: Record<ViewType, React.ReactElement> = {
		"config-view": <ConfigView />,
		"hotkeys-view": <HotkeysView />,
		"editor-rich-view": <EditorRichView />,
		"editor-source-view": <EditorSourceView />,
		"empty-view": <EmptyView />,
	};

	return viewMapping[viewType];
};
