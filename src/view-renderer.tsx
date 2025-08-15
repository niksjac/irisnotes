import type { FC } from "react";
import type { ViewType } from "@/types";
import { ConfigView, HotkeysView, EditorRichView, EditorSourceView, EmptyView } from "@/views";

interface ViewRendererProps {
	viewType: ViewType;
	viewData?: any;
}

export const ViewRenderer: FC<ViewRendererProps> = ({ viewType }) => {
	const viewMapping: Record<ViewType, React.ReactElement> = {
		"config-view": <ConfigView />,
		"hotkeys-view": <HotkeysView />,
		"editor-rich-view": <EditorRichView />,
		"editor-source-view": <EditorSourceView />,
		"empty-view": <EmptyView />,
	};

	return viewMapping[viewType];
};
