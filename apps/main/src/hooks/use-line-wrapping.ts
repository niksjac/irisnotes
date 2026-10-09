import { useAtom } from "jotai";
import { editorSettingsAtom } from "@/atoms/settings";

export function useLineWrapping() {
	const [editorSettings, setEditorSettings] = useAtom(editorSettingsAtom);

	const isWrapping = editorSettings?.lineWrapping ?? false;

	const toggleLineWrapping = () => {
		const newValue = !isWrapping;
		setEditorSettings((prev) => prev ? { ...prev, lineWrapping: newValue } : prev);
	};

	const setIsWrapping = (value: boolean) => {
		setEditorSettings((prev) => prev ? { ...prev, lineWrapping: value } : prev);
	};

	return {
		isWrapping,
		setIsWrapping,
		toggleLineWrapping,
	};
}
