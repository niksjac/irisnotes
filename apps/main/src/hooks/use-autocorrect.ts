import { useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { autocorrectConfigAtom } from "@/atoms/autocorrect";
import type { AutocorrectEntry } from "@/atoms/autocorrect";
import { autocorrectStore } from "@/components/editor/autocorrect-store";

/**
 * Parse raw TOML-loaded JSON into AutocorrectEntry[].
 * Each top-level key is a section with { trigger, replacement, description }.
 */
function parseAutocorrectConfig(parsed: Record<string, unknown>): AutocorrectEntry[] {
	const entries: AutocorrectEntry[] = [];

	for (const [, value] of Object.entries(parsed)) {
		if (typeof value !== "object" || value === null) continue;
		const section = value as Record<string, unknown>;
		const trigger = typeof section.trigger === "string" ? section.trigger : "";
		const replacement = typeof section.replacement === "string" ? section.replacement : "";
		const description = typeof section.description === "string" ? section.description : "";
		if (trigger && replacement) {
			entries.push({ trigger, replacement, description });
		}
	}

	return entries;
}

/**
 * Hook that loads autocorrect config from autocorrect.toml, keeps the
 * Jotai atom and the module-level autocorrectStore in sync, and provides
 * a saveConfig callback for the settings UI.
 */
export function useAutocorrect() {
	const [entries, setEntries] = useAtom(autocorrectConfigAtom);

	const loadConfig = useCallback(async () => {
		try {
			const configString = await invoke<string>("read_config", {
				filename: "autocorrect",
			});
			const parsed = JSON.parse(configString) as Record<string, unknown>;
			const loaded = parseAutocorrectConfig(parsed);
			setEntries(loaded);
			autocorrectStore.set(loaded);
		} catch {
			// autocorrect.toml doesn't exist or is empty — no entries
			setEntries([]);
			autocorrectStore.set([]);
		}
	}, [setEntries]);

	// Load config on mount + watch for changes
	useEffect(() => {
		loadConfig();

		let unlisten: (() => void) | null = null;
		listen("config-file-changed", (event) => {
			const payload = event.payload as any;
			if (
				payload?.filename === "autocorrect.toml" ||
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

	// Keep the store in sync whenever the atom changes
	useEffect(() => {
		autocorrectStore.set(entries);
	}, [entries]);

	const saveConfig = useCallback(async (newEntries: AutocorrectEntry[]) => {
		try {
			const config: Record<string, { trigger: string; replacement: string; description: string }> = {};
			for (const entry of newEntries) {
				const name = entry.description
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "_")
					.replace(/^_|_$/g, "")
					|| `entry_${newEntries.indexOf(entry)}`;
				config[name] = { trigger: entry.trigger, replacement: entry.replacement, description: entry.description };
			}
			await invoke("write_config", {
				filename: "autocorrect",
				content: JSON.stringify(config, null, 2),
			});
			setEntries(newEntries);
			autocorrectStore.set(newEntries);
		} catch (error) {
			console.error("Failed to save autocorrect config:", error);
		}
	}, [setEntries]);

	return { entries, saveConfig };
}
