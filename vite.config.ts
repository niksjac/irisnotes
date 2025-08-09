import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(() => ({
	plugins: [react(), tailwindcss()],

	// Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
	//
	// 1. prevent vite from obscuring rust errors
	clearScreen: false,

	// 2. tauri expects a fixed port, fail if that port is not available
	server: {
		port: 1420,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
					protocol: "ws",
					host,
					port: 1421,
				}
			: undefined,
		watch: {
			// 3. tell vite to ignore watching `src-tauri`
			ignored: ["**/src-tauri/**"],
		},
	},

	// Bundle optimization
	build: {
		// Optimize chunks
		rollupOptions: {
			output: {
				manualChunks: {
					// Separate vendor chunks
					"vendor-react": ["react", "react-dom"],
					"vendor-prosemirror": [
						"prosemirror-state",
						"prosemirror-view",
						"prosemirror-model",
						"prosemirror-transform",
						"prosemirror-keymap",
						"prosemirror-commands",
						"prosemirror-history",
						"prosemirror-inputrules",
						"prosemirror-schema-basic",
						"prosemirror-schema-list",
						"prosemirror-dropcursor",
						"prosemirror-gapcursor",
					],
					"vendor-codemirror": [
						"@codemirror/view",
						"@codemirror/state",
						"@codemirror/lang-html",
						"@codemirror/theme-one-dark",
						"@codemirror/commands",
						"@codemirror/search",
						"@codemirror/autocomplete",
						"@codemirror/language",
					],
					"vendor-tauri": [
						"@tauri-apps/api",
						"@tauri-apps/plugin-fs",
						"@tauri-apps/plugin-opener",
						"@tauri-apps/plugin-clipboard-manager",
						"@tauri-apps/plugin-dialog",
						"@tauri-apps/plugin-notification",
						"@tauri-apps/plugin-sql",
						"@tauri-apps/plugin-window-state",
						"@tauri-apps/plugin-global-shortcut",
					],
				},
			},
		},

		// Optimize for production
		minify: "terser" as const,
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
			},
		},

		// Enable source maps for debugging
		sourcemap: true,

		// Reduce bundle size
		chunkSizeWarningLimit: 1000,
	},

	// Path resolution
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
			"@/features": resolve(__dirname, "src/features"),
			"@/components": resolve(__dirname, "src/components"),
			"@/utils": resolve(__dirname, "src/utils"),
			"@/types": resolve(__dirname, "src/types"),
		},
	},

	// Optimize dependencies
	optimizeDeps: {
		include: ["react", "react-dom", "prosemirror-state", "prosemirror-view", "prosemirror-model"],
	},
}));
