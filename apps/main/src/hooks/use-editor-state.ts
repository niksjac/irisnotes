import { useAtomValue } from "jotai";
import { editorSettingsAtom } from "@/atoms/settings";

export function useEditorState() {
	const settings = useAtomValue(editorSettingsAtom);

	return {
		fontSize: settings?.fontSize ?? 14,
	};
}
