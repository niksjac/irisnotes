import { useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Fragment, Slice } from "prosemirror-model";
import { asciiArtConfigAtom } from "@/atoms/ascii-art";
import type { AsciiArtEntry } from "@/atoms/ascii-art";
import { activeEditorViewStore } from "@/components/editor/active-editor-view-store";

/**
 * Parse raw TOML-loaded JSON into AsciiArtEntry[].
 * Each top-level key is a section with { key, description, art }.
 */
function parseAsciiArtConfig(parsed: Record<string, unknown>): AsciiArtEntry[] {
	const entries: AsciiArtEntry[] = [];

	for (const [, value] of Object.entries(parsed)) {
		if (typeof value !== "object" || value === null) continue;
		const section = value as Record<string, unknown>;
		const key = typeof section.key === "string" ? section.key : "";
		const description = typeof section.description === "string" ? section.description : "";
		const art = typeof section.art === "string" ? section.art : "";
		if (key && art) {
			entries.push({ key, description, art });
		}
	}

	return entries;
}

interface ParsedKey {
	key: string;
	ctrl: boolean;
	shift: boolean;
	alt: boolean;
}

function parseKeyCombo(combo: string): ParsedKey {
	const parts = combo.toLowerCase().split("+");
	return {
		key: parts[parts.length - 1] ?? "",
		ctrl: parts.includes("ctrl") || parts.includes("mod"),
		shift: parts.includes("shift"),
		alt: parts.includes("alt"),
	};
}

function matchesKeyEvent(event: KeyboardEvent, parsed: ParsedKey): boolean {
	const eventKey = event.key.toLowerCase();
	const ctrl = event.ctrlKey || event.metaKey;

	if (ctrl !== parsed.ctrl) return false;
	if (event.shiftKey !== parsed.shift) return false;
	if (event.altKey !== parsed.alt) return false;

	// Match the final key part
	if (eventKey === parsed.key) return true;
	// Handle named keys like "1" matching event.code "Digit1"
	if (/^[0-9]$/.test(parsed.key) && event.code === `Digit${parsed.key}`) return true;
	if (/^[a-z]$/.test(parsed.key) && event.code === `Key${parsed.key.toUpperCase()}`) return true;

	return false;
}

/**
 * Insert text at the current cursor position in the active ProseMirror editor.
 * Each line of the ASCII art becomes a separate paragraph node.
 */
function insertAsciiArt(art: string): void {
	const view = activeEditorViewStore.get();
	if (!view) return;

	const { state } = view;
	const { schema } = state;
	const { from, to } = state.selection;

	// Split art into lines and create paragraph nodes
	// Trim leading/trailing empty lines (TOML triple-quoted strings add these)
	const lines = art.split("\n");
	while (lines.length > 0 && lines[0] === "") lines.shift();
	while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
	const paragraphType = schema.nodes.paragraph;
	if (!paragraphType) return;

	const nodes = lines.map((line: string) => {
		if (line.length === 0) {
			return paragraphType.create();
		}
		return paragraphType.create(null, [schema.text(line)]);
	});

	if (nodes.length === 0) return;

	// Open the paragraph slice so the first and last art lines splice into the current line.
	const slice = new Slice(Fragment.from(nodes), 1, 1);
	const tr = state.tr.replace(from, to, slice);

	view.dispatch(tr.scrollIntoView());
	view.focus();
}

/**
 * Hook that loads ASCII art config from ascii-art.toml and registers
 * dynamic keyboard shortcuts to insert them into the editor.
 */
export function useAsciiArt() {
	const [entries, setEntries] = useAtom(asciiArtConfigAtom);

	const loadConfig = useCallback(async () => {
		try {
			const configString = await invoke<string>("read_config", {
				filename: "ascii-art",
			});
			const parsed = JSON.parse(configString) as Record<string, unknown>;
			setEntries(parseAsciiArtConfig(parsed));
		} catch {
			// ascii-art.toml doesn't exist or is empty — no entries
			setEntries([]);
		}
	}, [setEntries]);

	// Load config on mount + watch for changes
	useEffect(() => {
		loadConfig();

		let unlisten: (() => void) | null = null;
		listen("config-file-changed", (event) => {
			const payload = event.payload as any;
			if (
				payload?.filename === "ascii-art.toml" ||
				!payload?.filename
			) {
				loadConfig();
			}
		}).then((fn) => {
			unlisten = fn;
		});

		return () => {
			if (unlisten) unlisten();
		};
	}, [loadConfig]);

	const saveConfig = useCallback(async (newEntries: AsciiArtEntry[]) => {
		try {
			// Build a TOML-friendly JSON object: { sectionName: { key, description, art } }
			const config: Record<string, { key: string; description: string; art: string }> = {};
			for (const entry of newEntries) {
				// Use a sanitized description as section name, or fallback to index
				const name = entry.description
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "_")
					.replace(/^_|_$/g, "")
					|| `entry_${newEntries.indexOf(entry)}`;
				config[name] = { key: entry.key, description: entry.description, art: entry.art };
			}
			await invoke("write_config", {
				filename: "ascii-art",
				content: JSON.stringify(config, null, 2),
			});
			setEntries(newEntries);
		} catch (error) {
			console.error("Failed to save ASCII art config:", error);
		}
	}, [setEntries]);

	// Register dynamic keydown listener for ASCII art hotkeys
	useEffect(() => {
		if (entries.length === 0) return;

		const parsedEntries = entries.map((entry) => ({
			parsed: parseKeyCombo(entry.key),
			art: entry.art,
		}));

		function handleKeyDown(event: KeyboardEvent) {
			for (const { parsed, art } of parsedEntries) {
				if (matchesKeyEvent(event, parsed)) {
					event.preventDefault();
					event.stopPropagation();
					insertAsciiArt(art);
					return;
				}
			}
		}

		document.addEventListener("keydown", handleKeyDown, true);
		return () => document.removeEventListener("keydown", handleKeyDown, true);
	}, [entries]);

	return { entries, saveConfig };
}
