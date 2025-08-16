import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { isWrappingAtom } from "../atoms";
import { useConfig } from "./use-config";

/**
 * Hook to persist critical app state to config on shutdown
 * This ensures user preferences are saved even if the app closes unexpectedly
 */
export const useAppPersistence = () => {
	const isWrapping = useAtomValue(isWrappingAtom);
	const { config, updateConfig, loading } = useConfig();

	// Save state on app shutdown/beforeunload
	useEffect(() => {
		if (loading) return;

		const persistAppState = () => {
			try {
				// Only update if state has changed to avoid unnecessary writes
				const needsUpdate = config?.editor?.lineWrapping !== isWrapping;

				if (needsUpdate && config?.editor) {
					updateConfig({
						editor: {
							...config.editor,
							lineWrapping: isWrapping,
						},
					});
				}
			} catch (error) {
				console.warn("Failed to persist app state on shutdown:", error);
			}
		};

		// Listen for beforeunload (browser/window close)
		window.addEventListener("beforeunload", persistAppState);

		// For Tauri apps, also listen for the app close event
		let tauriUnlisten: (() => void) | null = null;

		const setupTauriCloseHandler = async () => {
			try {
				// Check if we're in a Tauri context first
				if (typeof window !== 'undefined' && (window as any).__TAURI__) {
					// Dynamically import Tauri API (only available in Tauri context)
					const { listen } = await import("@tauri-apps/api/event");

					// Listen for close event
					const unlistenClose = await listen("tauri://close-requested", () => {
						persistAppState();
					});

					return unlistenClose;
				}
				return null;
			} catch (error) {
				// Not in Tauri context or Tauri not available
				console.debug("Tauri APIs not available, skipping native close handler:", error);
				return null;
			}
		};

		setupTauriCloseHandler()
			.then((unlisten) => {
				if (unlisten) {
					tauriUnlisten = unlisten;
				}
			})
			.catch((error) => {
				console.debug("Failed to setup Tauri close handler:", error);
			});

		// Cleanup
		return () => {
			window.removeEventListener("beforeunload", persistAppState);
			// Only try to unlisten if we have a valid unlisten function
			if (tauriUnlisten && typeof tauriUnlisten === 'function') {
				try {
					tauriUnlisten();
				} catch (error) {
					console.debug("Failed to unlisten Tauri event:", error);
				}
			}
			// Final save on component unmount
			persistAppState();
		};
	}, [isWrapping, config.editor, updateConfig, loading]);
};
