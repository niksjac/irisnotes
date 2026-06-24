import { useCallback, useMemo } from "react";
import { useAtomValue } from "jotai";
import { useHotkeys } from "react-hotkeys-hook";
import { itemsAtom } from "@/atoms/items";
import { useTabManagement } from "@/hooks/use-tab-management";

interface Binding {
	id: string;
	title: string;
	hotkey: string;
}

/**
 * Registers a single note's "jump" hotkey. Rendered once per bound note so the
 * useHotkeys call stays unconditional (Rules of Hooks). enableOnFormTags /
 * enableOnContentEditable let it fire even while typing in another note.
 */
function NoteHotkeyBinding({
	binding,
	onOpen,
}: {
	binding: Binding;
	onOpen: (id: string, title: string) => void;
}) {
	useHotkeys(
		binding.hotkey,
		(e) => {
			e.preventDefault();
			onOpen(binding.id, binding.title);
		},
		{
			enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"],
			enableOnContentEditable: true,
			preventDefault: true,
		},
		[binding.id, binding.title, binding.hotkey, onOpen]
	);
	return null;
}

/**
 * App-scoped per-note hotkeys: pressing a note's configured combo anywhere in
 * IrisNotes opens and activates that note. Mounted once in the layout.
 */
export function NoteHotkeyRegistrar() {
	const items = useAtomValue(itemsAtom);
	const { openItemInTab } = useTabManagement();

	const bindings = useMemo<Binding[]>(
		() =>
			items
				.filter(
					(item) =>
						item.type === "note" &&
						typeof item.metadata?.jumpHotkey === "string" &&
						item.metadata.jumpHotkey.trim().length > 0
				)
				.map((item) => ({
					id: item.id,
					title: item.title,
					hotkey: (item.metadata.jumpHotkey as string).trim(),
				})),
		[items]
	);

	const onOpen = useCallback(
		(id: string, title: string) => {
			openItemInTab({ id, title, type: "note" });
		},
		[openItemInTab]
	);

	return (
		<>
			{bindings.map((binding) => (
				// key includes the hotkey so a changed combo remounts and re-registers
				<NoteHotkeyBinding
					key={`${binding.id}:${binding.hotkey}`}
					binding={binding}
					onOpen={onOpen}
				/>
			))}
		</>
	);
}
