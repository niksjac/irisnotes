import type { FC } from "react";
import type { ViewType } from "@/types";
import {
	AsciiArtView,
	AutocorrectView,
	BookView,
	BrandingView,
	ConfigView,
	HotkeysView,
	IconEditorView,
	EditorRichView,
	EditorSourceView,
	SectionView,
} from "@/views";

interface ViewProps {
	viewType: ViewType;
	viewData?: any;
}

export const View: FC<ViewProps> = ({ viewType, viewData }) => {
	switch (viewType) {
		case "ascii-art-view":
			return <AsciiArtView />;
		case "autocorrect-view":
			return <AutocorrectView />;
		case "book-view":
			return <BookView viewData={viewData} />;
		case "branding-view":
			return <BrandingView />;
		case "config-view":
			return <ConfigView />;
		case "hotkeys-view":
			return <HotkeysView />;
		case "icon-editor-view":
			return <IconEditorView />;
		case "editor-rich-view":
			return <EditorRichView viewData={viewData} />;
		case "editor-source-view":
			return <EditorSourceView viewData={viewData} />;
		case "section-view":
			return <SectionView viewData={viewData} />;
		default:
			return null;
	}
};
