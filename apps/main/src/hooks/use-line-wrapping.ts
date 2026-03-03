import { useAtom } from "jotai";
import { editorSettingsAtom } from "@/atoms/settings";
import { useConfig } from "./use-config";

export function useLineWrapping() {
	const [editorSettings, setEditorSettings] = useAtom(editorSettingsAtom);
	const { config, updateConfig } = useConfig();

	// Read from editorSettingsAtom (SQLite-backed, instant) with config fallback
	const isWrapping = editorSettings?.lineWrapping ?? config?.editor?.lineWrapping ?? false;

	const toggleLineWrapping = () => {
		const newValue = !isWrapping;
		// Instant UI update via Jotai — no await, no IPC round-trip
		setEditorSettings((prev) => prev ? { ...prev, lineWrapping: newValue } : prev);
		// Fire-and-forget config.toml sync (non-blocking)
		void updateConfig({ editor: { ...config?.editor, lineWrapping: newValue } });
	};

	const setIsWrapping = (value: boolean) => {
		setEditorSettings((prev) => prev ? { ...prev, lineWrapping: value } : prev);
		void updateConfig({ editor: { ...config?.editor, lineWrapping: value } });
	};

	return {
		isWrapping,
		setIsWrapping,
		toggleLineWrapping,
	};
}
