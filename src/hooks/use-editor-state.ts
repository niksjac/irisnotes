import { useAtom } from "jotai";
import { fontSizeAtom } from "@/atoms";

export function useEditorState() {
	const [fontSize, setFontSize] = useAtom(fontSizeAtom);

	return {
		fontSize,
		setFontSize,
	};
}
