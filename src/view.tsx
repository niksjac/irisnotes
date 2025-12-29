import type { FC } from "react";
import type { ViewType } from "@/types";
import {
	BookView,
	ConfigView,
	HotkeysView,
	EditorRichView,
	EditorSourceView,
	EmptyView,
	SectionView,
} from "@/views";

interface ViewProps {
	viewType: ViewType;
	viewData?: any;
}

export const View: FC<ViewProps> = ({ viewType, viewData }) => {
	switch (viewType) {
		case "book-view":
			return <BookView viewData={viewData} />;
		case "config-view":
			return <ConfigView />;
		case "hotkeys-view":
			return <HotkeysView />;
		case "editor-rich-view":
			return <EditorRichView viewData={viewData} />;
		case "editor-source-view":
			return <EditorSourceView viewData={viewData} />;
		case "section-view":
			return <SectionView viewData={viewData} />;
		case "empty-view":
			return <EmptyView />;
		default:
			return <EmptyView />;
	}
};
