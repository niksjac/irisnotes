import type { FC } from "react";
import type { ViewType } from "@/types";
import {
	ConfigView,
	HotkeysView,
	EditorRichView,
	EditorSourceView,
	EmptyView,
} from "@/views";

interface ViewProps {
	viewType: ViewType;
	viewData?: any;
}

export const View: FC<ViewProps> = ({ viewType, viewData }) => {
	switch (viewType) {
		case "config-view":
			return <ConfigView />;
		case "hotkeys-view":
			return <HotkeysView />;
		case "editor-rich-view":
			return <EditorRichView viewData={viewData} />;
		case "editor-source-view":
			return <EditorSourceView viewData={viewData} />;
		case "empty-view":
			return <EmptyView />;
		default:
			return <EmptyView />;
	}
};
