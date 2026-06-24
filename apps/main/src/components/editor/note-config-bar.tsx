import { useCallback, useEffect, useState } from "react";
import { Keyboard, X } from "lucide-react";
import { useItems } from "@/hooks";
import type { FlexibleItem } from "@/types/items";

interface NoteConfigBarProps {
	note: FlexibleItem;
}

const MODIFIER_KEYS = new Set(["Control", "Shift", "Alt", "Meta"]);

const KEY_ALIASES: Record<string, string> = {
	" ": "space",
	arrowup: "up",
	arrowdown: "down",
	arrowleft: "left",
	arrowright: "right",
	escape: "esc",
};

/**
 * Build a react-hotkeys-hook combo string ("ctrl+alt+1") from a keydown event.
 * Requires at least one modifier so a note's jump hotkey can never fire from
 * plain typing. Returns null for modifier-only or unmodified presses.
 */
function comboFromEvent(e: KeyboardEvent): string | null {
	if (MODIFIER_KEYS.has(e.key)) return null;

	const parts: string[] = [];
	if (e.ctrlKey) parts.push("ctrl");
	if (e.altKey) parts.push("alt");
	if (e.shiftKey) parts.push("shift");
	if (e.metaKey) parts.push("meta");
	if (parts.length === 0) return null;

	const key = e.key.toLowerCase();
	parts.push(KEY_ALIASES[key] ?? key);
	return parts.join("+");
}

/** Pretty-print a combo for display ("ctrl+alt+1" -> "Ctrl+Alt+1"). */
function formatCombo(combo: string): string {
	return combo
		.split("+")
		.map((part) => {
			if (part === "ctrl") return "Ctrl";
			if (part === "alt") return "Alt";
			if (part === "shift") return "Shift";
			if (part === "meta") return "⌘";
			return part.length === 1
				? part.toUpperCase()
				: part.charAt(0).toUpperCase() + part.slice(1);
		})
		.join("+");
}

export function NoteConfigBar({ note }: NoteConfigBarProps) {
	const { updateItemMetadata } = useItems();
	const current =
		typeof note.metadata?.jumpHotkey === "string"
			? note.metadata.jumpHotkey
			: "";
	const [capturing, setCapturing] = useState(false);

	// Cancel an in-progress capture when switching notes.
	useEffect(() => {
		setCapturing(false);
	}, [note.id]);

	const save = useCallback(
		(combo: string | undefined) => {
			void updateItemMetadata(note.id, { jumpHotkey: combo });
		},
		[updateItemMetadata, note.id]
	);

	// While capturing, intercept the next keystroke at the capture phase so it
	// beats react-hotkeys-hook (app + note hotkeys) and never types into the note.
	useEffect(() => {
		if (!capturing) return;

		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				e.stopImmediatePropagation();
				setCapturing(false);
				return;
			}
			if (MODIFIER_KEYS.has(e.key)) return; // wait for the non-modifier key

			e.preventDefault();
			e.stopImmediatePropagation();
			const combo = comboFromEvent(e);
			if (combo) {
				save(combo);
				setCapturing(false);
			}
			// No modifier held: ignore and keep waiting for a valid combo.
		};

		document.addEventListener("keydown", handler, { capture: true });
		return () =>
			document.removeEventListener("keydown", handler, { capture: true });
	}, [capturing, save]);

	return (
		<div className="flex-shrink-0 min-h-7 px-3 py-1 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-[11px] text-gray-600 dark:text-gray-300 select-none">
			<div className="flex min-w-0 flex-wrap items-center gap-2">
				<span className="inline-flex items-center gap-1.5 whitespace-nowrap text-gray-500 dark:text-gray-400">
					<Keyboard className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
					Jump hotkey
				</span>

				<button
					type="button"
					onClick={() => setCapturing((c) => !c)}
					className={`inline-flex items-center gap-1.5 rounded px-2 py-0.5 font-medium transition-colors cursor-pointer ${
						capturing
							? "bg-blue-50 text-blue-700 ring-1 ring-blue-400 dark:bg-blue-950/40 dark:text-blue-300"
							: current
								? "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
								: "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800"
					}`}
					title="Set a hotkey that opens this note from anywhere in IrisNotes"
				>
					{capturing
						? "Press keys… (Esc to cancel)"
						: current
							? formatCombo(current)
							: "Click to set"}
				</button>

				{current && !capturing && (
					<button
						type="button"
						onClick={() => save(undefined)}
						className="inline-flex items-center text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
						title="Clear hotkey"
					>
						<X className="w-3.5 h-3.5" />
					</button>
				)}

				<span className="hidden sm:inline text-gray-400 dark:text-gray-500">
					Opens this note from anywhere in IrisNotes (needs a modifier)
				</span>
			</div>
		</div>
	);
}
