import { useTheme } from "@/hooks";
import { useConfig } from "@/hooks/use-config";
import type { StorageSettings } from "@/types";

export function ConfigView() {
	const { darkMode, toggleDarkMode } = useTheme();
	const { config, updateConfig } = useConfig();

	const handleStorageBackendChange = async (backend: StorageSettings["backend"]) => {
		const newStorageConfig: StorageSettings = {
			backend,
		};

		// Only add the relevant storage config for the selected backend
		if (backend === "sqlite") {
			newStorageConfig.sqlite = {
				database_path: config.storage.sqlite?.database_path || "notes.db",
			};
			} else if (backend === "json-single") {
		newStorageConfig.jsonSingle = {
			file_path: config.storage.jsonSingle?.file_path || "./dev/storage.json",
		};
	} else if (backend === "json-hybrid") {
		newStorageConfig.jsonHybrid = {
			structure_file: config.storage.jsonHybrid?.structure_file || "./dev/structure.json",
			content_dir: config.storage.jsonHybrid?.content_dir || "./dev/content/",
		};
		} else if (backend === "cloud") {
			newStorageConfig.cloud = {
				provider: config.storage.cloud?.provider || "google-drive",
			};
		}

		await updateConfig({
			storage: newStorageConfig,
		});
	};

	const handleSQLitePathChange = async (path: string) => {
		await updateConfig({
			storage: {
				...config.storage,
				sqlite: {
					database_path: path,
				},
			},
		});
	};

	const handleJsonSinglePathChange = async (path: string) => {
		await updateConfig({
			storage: {
				...config.storage,
				jsonSingle: {
					file_path: path,
				},
			},
		});
	};

	const handleJsonHybridStructureChange = async (path: string) => {
		await updateConfig({
			storage: {
				...config.storage,
				jsonHybrid: {
					...config.storage.jsonHybrid,
					structure_file: path,
					content_dir: config.storage.jsonHybrid?.content_dir || "./dev/content/",
				},
			},
		});
	};

	const handleJsonHybridContentDirChange = async (path: string) => {
		await updateConfig({
			storage: {
				...config.storage,
				jsonHybrid: {
					...config.storage.jsonHybrid,
					structure_file: config.storage.jsonHybrid?.structure_file || "./dev/structure.json",
					content_dir: path,
				},
			},
		});
	};

	const handleCloudProviderChange = async (provider: "google-drive" | "dropbox" | "onedrive") => {
		await updateConfig({
			storage: {
				...config.storage,
				cloud: {
					provider,
				},
			},
		});
	};

	const handleCustomConfigPathChange = async (path: string) => {
		const newProduction = { ...config.production };
		if (path) {
			newProduction.customConfigPath = path;
		} else {
			delete newProduction.customConfigPath;
		}
		await updateConfig({ production: newProduction });
	};

	const handleCustomDatabasePathChange = async (path: string) => {
		const newProduction = { ...config.production };
		if (path) {
			newProduction.customDatabasePath = path;
		} else {
			delete newProduction.customDatabasePath;
		}
		await updateConfig({ production: newProduction });
	};

	const handleCustomNotesPathChange = async (path: string) => {
		const newProduction = { ...config.production };
		if (path) {
			newProduction.customNotesPath = path;
		} else {
			delete newProduction.customNotesPath;
		}
		await updateConfig({ production: newProduction });
	};

	return (
		<div className="config-view">
			<h1>Configuration</h1>

			{/* Storage Settings */}
			<section className="config-section">
				<h2>Storage Settings</h2>

				<div className="config-section-grid">
					{/* Storage Backend Selection */}
					<div className="config-card">
						<div className="config-setting-label">Storage Backend</div>
						<div className="config-setting-description">
							Choose how your notes are stored. Changing this will switch to the new storage - notes from other storages
							won't be visible until you switch back.
						</div>
						<select
							className="config-select"
							value={config.storage.backend}
							onChange={(e) => handleStorageBackendChange(e.target.value as StorageSettings["backend"])}
						>
												<option value="sqlite">SQLite Database</option>
					<option value="json-single">JSON Single File</option>
					<option value="json-hybrid">JSON Hybrid</option>
					<option value="cloud">Cloud Storage</option>
						</select>
					</div>

					{/* SQLite Configuration */}
					{config.storage.backend === "sqlite" && (
						<div className="config-card">
							<div className="config-setting-label">SQLite Database Path</div>
							<div className="config-setting-description">Path to the SQLite database file</div>
							<input
								type="text"
								className="config-input config-input--path"
								value={config.storage.sqlite?.database_path || "notes.db"}
								onChange={(e) => handleSQLitePathChange(e.target.value)}
							/>
						</div>
					)}

					{/* JSON Single File Configuration */}
					{config.storage.backend === "json-single" && (
						<div className="config-card">
							<div className="config-setting-label">Storage File Path</div>
							<div className="config-setting-description">
								Path to the JSON file where all data will be stored
							</div>
							<input
								type="text"
								className="config-input config-input--path"
								value={config.storage.jsonSingle?.file_path || "./dev/storage.json"}
								onChange={(e) => handleJsonSinglePathChange(e.target.value)}
							/>
						</div>
					)}

					{/* JSON Hybrid Configuration */}
					{config.storage.backend === "json-hybrid" && (
						<div className="config-card">
							<div className="config-setting-label">JSON Hybrid Storage</div>
							<div className="config-setting-description">
								Structure in JSON file, content in separate files
							</div>
							<div className="space-y-4">
								<div>
									<label className="block text-sm font-medium mb-2">Structure File</label>
									<input
										type="text"
										className="config-input config-input--path"
										value={config.storage.jsonHybrid?.structure_file || "./dev/structure.json"}
										onChange={(e) => handleJsonHybridStructureChange(e.target.value)}
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-2">Content Directory</label>
									<input
										type="text"
										className="config-input config-input--path"
										value={config.storage.jsonHybrid?.content_dir || "./dev/content/"}
										onChange={(e) => handleJsonHybridContentDirChange(e.target.value)}
									/>
								</div>
							</div>
						</div>
					)}

					{/* Cloud Storage Configuration */}
					{config.storage.backend === "cloud" && (
						<div className="config-card">
							<div className="config-setting-label">Cloud Provider</div>
							<div className="config-setting-description">Choose your cloud storage provider (Not yet implemented)</div>
							<select
								className="config-select"
								value={config.storage.cloud?.provider || "google-drive"}
								onChange={(e) => handleCloudProviderChange(e.target.value as "google-drive" | "dropbox" | "onedrive")}
								disabled
							>
								<option value="google-drive">Google Drive</option>
								<option value="dropbox">Dropbox</option>
								<option value="onedrive">OneDrive</option>
							</select>
						</div>
					)}

					{/* Storage Status */}
					<div className="config-card">
						<div className="config-setting-label">Current Storage Status</div>
						<div className="config-status">
							Backend: {config.storage.backend}
							{config.storage.backend === "sqlite" && <div>Database: {config.storage.sqlite?.database_path}</div>}
									{config.storage.backend === "json-single" && (
			<div>File: {config.storage.jsonSingle?.file_path}</div>
		)}
		{config.storage.backend === "json-hybrid" && (
			<div>
				<div>Structure: {config.storage.jsonHybrid?.structure_file}</div>
				<div>Content Dir: {config.storage.jsonHybrid?.content_dir}</div>
			</div>
		)}
							{config.storage.backend === "cloud" && <div>Provider: {config.storage.cloud?.provider}</div>}
						</div>
						<div className="config-status-warning">
							⚠️ Note: Changing storage backends will hide notes from other storages until you switch back
						</div>
					</div>
				</div>
			</section>

			{/* Production Path Settings */}
			{!import.meta.env.DEV && (
				<section className="config-section">
					<h2>Custom Paths</h2>

					<div className="config-section-grid">
						<div className="config-card">
							<div className="config-setting-label">Custom Config Directory</div>
							<div className="config-setting-description">
								Override the default config directory (default: ~/.config/irisnotes/)
							</div>
							<input
								type="text"
								className="config-input config-input--long-path"
								value={config.production.customConfigPath || ""}
								onChange={(e) => handleCustomConfigPathChange(e.target.value)}
								placeholder="~/.config/irisnotes/"
							/>
						</div>

						<div className="config-card">
							<div className="config-setting-label">Custom Database Path</div>
							<div className="config-setting-description">Override the default database file location</div>
							<input
								type="text"
								className="config-input config-input--long-path"
								value={config.production.customDatabasePath || ""}
								onChange={(e) => handleCustomDatabasePathChange(e.target.value)}
								placeholder="~/.config/irisnotes/notes.db"
							/>
						</div>

						<div className="config-card">
							<div className="config-setting-label">Custom Notes Directory</div>
							<div className="config-setting-description">
								Override the default notes directory for file-system backend
							</div>
							<input
								type="text"
								className="config-input config-input--long-path"
								value={config.production.customNotesPath || ""}
								onChange={(e) => handleCustomNotesPathChange(e.target.value)}
								placeholder="~/.config/irisnotes/notes/"
							/>
						</div>
					</div>
				</section>
			)}

			{/* Development Mode Notice */}
			{import.meta.env.DEV && (
				<section className="config-section">
					<div className="config-dev-notice">
						<div className="config-dev-notice-title">Development Mode</div>
						<div className="config-dev-notice-content">
							Running in development mode with local config directory: <code>./dev/config/</code>
						</div>
					</div>
				</section>
			)}

			{/* Theme Settings */}
			<section className="config-section">
				<h2>Theme Settings</h2>

				<div className="config-theme-toggle">
					<div className="config-theme-info">
						<div className="config-setting-label">Dark Mode</div>
						<div className="config-setting-description">Toggle between light and dark theme</div>
					</div>
					<button className={`config-button ${darkMode ? "config-button--active" : ""}`} onClick={toggleDarkMode}>
						{darkMode ? "Enabled" : "Disabled"}
					</button>
				</div>
			</section>

			{/* Editor Settings */}
			<section className="config-section">
				<h2>Editor Settings</h2>

				<div className="config-section-grid">
					<div className="config-card">
						<div className="config-setting-label">Editor Mode</div>
						<div className="config-setting-description">Choose your preferred editing mode</div>
						<select className="config-select">
							<option value="rich">Rich Text Editor</option>
							<option value="source">Source Editor</option>
							<option value="split">Split View</option>
						</select>
					</div>

					<div className="config-card">
						<div className="config-setting-label">Auto Save</div>
						<div className="config-setting-description">Automatically save changes as you type</div>
						<label className="config-checkbox-label">
							<input type="checkbox" className="config-checkbox" defaultChecked={true} />
							<span className="config-checkbox-text">Enable auto save</span>
						</label>
					</div>
				</div>
			</section>

			{/* Application Settings */}
			<section className="config-section">
				<h2>Application Settings</h2>

				<div className="config-section-grid">
					<div className="config-card">
						<div className="config-setting-label">Default Category</div>
						<div className="config-setting-description">Default category for new notes</div>
						<select className="config-select">
							<option value="general">General</option>
							<option value="work">Work</option>
							<option value="personal">Personal</option>
						</select>
					</div>

					<div className="config-card">
						<div className="config-setting-label">Show Word Count</div>
						<div className="config-setting-description">Display word count in editor status bar</div>
						<label className="config-checkbox-label">
							<input type="checkbox" className="config-checkbox" defaultChecked={true} />
							<span className="config-checkbox-text">Show word count</span>
						</label>
					</div>
				</div>
			</section>

			{/* Configuration Info */}
			<section>
				<h2>Configuration Information</h2>

				<div className="config-info-display">
					<pre className="config-info-pre">{JSON.stringify(config, null, 2)}</pre>
				</div>
			</section>
		</div>
	);
}
