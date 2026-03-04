import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/hooks";
import { useConfig } from "@/hooks/use-config";
import { useEditorSettings } from "@/hooks/use-editor-settings";
import { useAtomValue } from "jotai";
import { itemsAtom, notesAtom, booksAtom, sectionsAtom } from "@/atoms/items";
import { exportSettings, importSettings } from "@/storage/settings";
import type {
	CursorWidth,
	CursorBlinkStyle,
} from "@/types/editor-settings";
import { FONT_FAMILIES, getFontsByGroup } from "@/components/editor/format-constants";
import * as Icons from "lucide-react";
import { THEMES } from "@/config/themes";

export function ConfigView() {
	const { themeName, setTheme } = useTheme();
	const { config } = useConfig();
	const { settings: editorSettings, updateSetting, resetSettings, constraints } = useEditorSettings();

	// Export/Import state
	const [isExporting, setIsExporting] = useState(false);
	const [isImporting, setIsImporting] = useState(false);

	// Database stats
	const items = useAtomValue(itemsAtom);
	const notes = useAtomValue(notesAtom);
	const books = useAtomValue(booksAtom);
	const sections = useAtomValue(sectionsAtom);

	// Storage backend - SQLite only

	const handleExportSettings = async () => {
		setIsExporting(true);
		try {
			await exportSettings();
		} finally {
			setIsExporting(false);
		}
	};

	const handleImportSettings = async () => {
		setIsImporting(true);
		try {
			const success = await importSettings();
			if (success) {
				window.location.reload();
			}
		} finally {
			setIsImporting(false);
		}
	};

	return (
		<div className="h-full overflow-auto bg-white dark:bg-gray-900">
			<div className="max-w-4xl mx-auto p-6 space-y-8">
				{/* Header */}
				<div className="border-b border-gray-200 dark:border-gray-700 pb-4">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
						<Icons.Settings className="w-7 h-7" />
						Settings
					</h1>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Configure your IrisNotes experience
					</p>
				</div>

				{/* Appearance Section */}
				<section className="space-y-4">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
						<Icons.Palette className="w-5 h-5" />
						Appearance
					</h2>

					<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
						<div>
							<div className="font-medium text-gray-900 dark:text-gray-100 mb-1">Theme</div>
							<div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
								Pick a theme — surface colors, text, and accent all change together
							</div>
							{/* Light themes row */}
							<div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Light</div>
							<div className="grid grid-cols-3 gap-2 mb-4">
								{THEMES.filter((t) => !t.isDark).map((t) => (
									<button
										key={t.id}
										onClick={() => setTheme(t.id)}
										className={`relative rounded-lg overflow-hidden border-2 transition-all ${
											themeName === t.id
												? "border-blue-500 ring-2 ring-blue-500/30"
												: "border-transparent hover:border-gray-400 dark:hover:border-gray-500"
										}`}
									>
										{/* Swatch preview */}
										<div className="h-12 flex" style={{ backgroundColor: t.swatch.bg }}>
											<div className="w-1/4 h-full" style={{ backgroundColor: t.swatch.panel }} />
											<div className="flex-1 flex items-center justify-center gap-1 px-1">
												<div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.swatch.accent }} />
												<div className="h-1 flex-1 rounded-full opacity-60" style={{ backgroundColor: t.swatch.text }} />
											</div>
										</div>
										{/* Label */}
										<div
											className="px-2 py-1 text-xs font-medium truncate"
											style={{ backgroundColor: t.swatch.panel, color: t.swatch.text }}
										>
											{t.label}
											{themeName === t.id && (
												<Icons.Check className="inline w-3 h-3 ml-1" style={{ color: t.swatch.accent }} />
											)}
										</div>
									</button>
								))}
							</div>
							{/* Dark themes rows */}
							<div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Dark</div>
							<div className="grid grid-cols-3 gap-2">
								{THEMES.filter((t) => t.isDark).map((t) => (
									<button
										key={t.id}
										onClick={() => setTheme(t.id)}
										className={`relative rounded-lg overflow-hidden border-2 transition-all ${
											themeName === t.id
												? "border-blue-500 ring-2 ring-blue-500/30"
												: "border-transparent hover:border-gray-400 dark:hover:border-gray-500"
										}`}
									>
										{/* Swatch preview */}
										<div className="h-12 flex" style={{ backgroundColor: t.swatch.bg }}>
											<div className="w-1/4 h-full" style={{ backgroundColor: t.swatch.panel }} />
											<div className="flex-1 flex items-center justify-center gap-1 px-1">
												<div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.swatch.accent }} />
												<div className="h-1 flex-1 rounded-full opacity-60" style={{ backgroundColor: t.swatch.text }} />
											</div>
										</div>
										{/* Label */}
										<div
											className="px-2 py-1 text-xs font-medium truncate"
											style={{ backgroundColor: t.swatch.panel, color: t.swatch.text }}
										>
											{t.label}
											{themeName === t.id && (
												<Icons.Check className="inline w-3 h-3 ml-1" style={{ color: t.swatch.accent }} />
											)}
										</div>
									</button>
								))}
							</div>
						</div>
					</div>
				</section>

				{/* Database Section */}
				<section className="space-y-4">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
						<Icons.Database className="w-5 h-5" />
						Database
					</h2>

					<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
						{/* Connection Status */}
						<div className="flex items-center justify-between">
							<div>
								<div className="font-medium text-gray-900 dark:text-gray-100">
									Status
								</div>
								<div className="text-sm text-gray-500 dark:text-gray-400">
									Database connection
								</div>
							</div>
							<div className="flex items-center gap-2">
								<span className="w-2 h-2 rounded-full bg-green-500" />
								<span className="text-sm font-medium text-green-600 dark:text-green-400">
									Connected
								</span>
							</div>
						</div>

						{/* Item Counts */}
						<div className="pt-3 border-t border-gray-200 dark:border-gray-700">
							<div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
								Content Statistics
							</div>
							<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
								<div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
									<div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
										{items.length}
									</div>
									<div className="text-xs text-gray-500 dark:text-gray-400">
										Total Items
									</div>
								</div>
								<div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
									<div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
										{notes.length}
									</div>
									<div className="text-xs text-gray-500 dark:text-gray-400">
										Notes
									</div>
								</div>
								<div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
									<div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
										{books.length}
									</div>
									<div className="text-xs text-gray-500 dark:text-gray-400">
										Books
									</div>
								</div>
								<div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
									<div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
										{sections.length}
									</div>
									<div className="text-xs text-gray-500 dark:text-gray-400">
										Sections
									</div>
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Storage Section */}
				<section className="space-y-4">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
						<Icons.HardDrive className="w-5 h-5" />
						Storage
					</h2>

					<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
						{/* Backend Info */}
						<div className="flex items-start gap-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
							<Icons.Database className="w-5 h-5 text-blue-500 mt-0.5" />
							<div>
								<div className="font-medium text-gray-900 dark:text-gray-100">
									SQLite Database
								</div>
								<div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
									Fast, reliable local database.
									{config.storage.sqlite?.database_path && (
										<div className="mt-2">
											<span className="text-gray-600 dark:text-gray-400">
												Path:{" "}
											</span>
											<code className="text-xs bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded">
												{config.storage.sqlite.database_path}
											</code>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>
				</section>

				{/* Editor Section */}
				<section className="space-y-4">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
						<Icons.Edit3 className="w-5 h-5" />
						Editor
					</h2>

					<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
						{/* Font Size */}
						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<div className="font-medium text-gray-900 dark:text-gray-100">
									Font Size
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-300">
									{editorSettings.fontSize}px
								</div>
							</div>
							<input
								type="range"
								min={constraints.fontSize.min}
								max={constraints.fontSize.max}
								step={constraints.fontSize.step}
								value={editorSettings.fontSize}
								onChange={(e) => updateSetting("fontSize", Number(e.target.value))}
								className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
							/>
						</div>

						{/* Font Family */}
						<div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
							<div>
								<div className="font-medium text-gray-900 dark:text-gray-100">
									Font Family
								</div>
								<div className="text-sm text-gray-500 dark:text-gray-400">
									Editor text font
								</div>
							</div>
							<SettingsFontPicker
								value={editorSettings.fontFamily}
								onChange={(v) => updateSetting("fontFamily", v)}
							/>
						</div>

						{/* Line Height */}
						<div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
							<div className="flex items-center justify-between">
								<div className="font-medium text-gray-900 dark:text-gray-100">
									Line Height
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-300">
									{editorSettings.lineHeight.toFixed(1)}
								</div>
							</div>
							<input
								type="range"
								min={constraints.lineHeight.min}
								max={constraints.lineHeight.max}
								step={constraints.lineHeight.step}
								value={editorSettings.lineHeight}
								onChange={(e) => updateSetting("lineHeight", Number(e.target.value))}
								className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
							/>
						</div>

						{/* Paragraph Spacing */}
						<div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
							<div className="flex items-center justify-between">
								<div className="font-medium text-gray-900 dark:text-gray-100">
									Paragraph Spacing
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-300">
									{editorSettings.paragraphSpacing.toFixed(1)}em
								</div>
							</div>
							<input
								type="range"
								min={constraints.paragraphSpacing.min}
								max={constraints.paragraphSpacing.max}
								step={constraints.paragraphSpacing.step}
								value={editorSettings.paragraphSpacing}
								onChange={(e) => updateSetting("paragraphSpacing", Number(e.target.value))}
								className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
							/>
						</div>

						{/* Letter Spacing */}
						<div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
							<div className="flex items-center justify-between">
								<div className="font-medium text-gray-900 dark:text-gray-100">
									Letter Spacing
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-300">
									{editorSettings.letterSpacing !== undefined
										? `${editorSettings.letterSpacing >= 0 ? "+" : ""}${editorSettings.letterSpacing.toFixed(2)}em`
										: "0.00em"}
								</div>
							</div>
							<input
								type="range"
								min={constraints.letterSpacing.min}
								max={constraints.letterSpacing.max}
								step={constraints.letterSpacing.step}
								value={editorSettings.letterSpacing ?? 0}
								onChange={(e) => updateSetting("letterSpacing", Number(e.target.value))}
								className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
							/>
						</div>

						{/* Editor Padding */}
						<div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
							<div className="flex items-center justify-between">
								<div className="font-medium text-gray-900 dark:text-gray-100">
									Editor Padding
								</div>
								<div className="text-sm text-gray-600 dark:text-gray-300">
									{editorSettings.editorPadding}px
								</div>
							</div>
							<input
								type="range"
								min={constraints.editorPadding.min}
								max={constraints.editorPadding.max}
								step={constraints.editorPadding.step}
								value={editorSettings.editorPadding}
								onChange={(e) => updateSetting("editorPadding", Number(e.target.value))}
								className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer"
							/>
						</div>

						{/* Line Wrapping */}
						<div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
							<div>
								<div className="font-medium text-gray-900 dark:text-gray-100">
									Line Wrapping
								</div>
								<div className="text-sm text-gray-500 dark:text-gray-400">
									Wrap long lines in the editor
								</div>
							</div>
							<button
								onClick={() => updateSetting("lineWrapping", !editorSettings.lineWrapping)}
								className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
									editorSettings.lineWrapping ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
								}`}
							>
								<span
									className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
										editorSettings.lineWrapping ? "translate-x-6" : "translate-x-1"
									}`}
								/>
							</button>
						</div>

						{/* Cursor Settings Subsection */}
						<div className="pt-4 border-t border-gray-200 dark:border-gray-700">
							<h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
								<Icons.Type className="w-4 h-4" />
								Cursor
							</h3>

							{/* Cursor Width */}
							<div className="flex items-center justify-between mb-3">
								<div>
									<div className="font-medium text-gray-900 dark:text-gray-100">
										Cursor Width
									</div>
									<div className="text-sm text-gray-500 dark:text-gray-400">
										Width of the text cursor
									</div>
								</div>
								<select
									value={editorSettings.cursorWidth}
									onChange={(e) => {
										const val = e.target.value;
										updateSetting("cursorWidth", val === "block" ? "block" : Number(val) as CursorWidth);
									}}
									className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_0.75rem_center] bg-no-repeat pr-8"
								>
									<option value={1} className="bg-gray-100 dark:bg-gray-700">Thin (1px)</option>
									<option value={2} className="bg-gray-100 dark:bg-gray-700">Normal (2px)</option>
									<option value={3} className="bg-gray-100 dark:bg-gray-700">Thick (3px)</option>
									<option value="block" className="bg-gray-100 dark:bg-gray-700">Block</option>
								</select>
							</div>

							{/* Cursor Animation */}
							<div className="flex items-center justify-between mb-3">
								<div>
									<div className="font-medium text-gray-900 dark:text-gray-100">
										Cursor Animation
									</div>
									<div className="text-sm text-gray-500 dark:text-gray-400">
										Cursor blink style
									</div>
								</div>
								<select
									value={editorSettings.cursorBlinkStyle}
									onChange={(e) => updateSetting("cursorBlinkStyle", e.target.value as CursorBlinkStyle)}
									className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-sm cursor-pointer hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M6%208L1%203h10z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px] bg-[right_0.75rem_center] bg-no-repeat pr-8"
								>
									<option value="blink" className="bg-gray-100 dark:bg-gray-700">Blink</option>
									<option value="smooth" className="bg-gray-100 dark:bg-gray-700">Smooth</option>
									<option value="expand" className="bg-gray-100 dark:bg-gray-700">Expand</option>
									<option value="solid" className="bg-gray-100 dark:bg-gray-700">Solid (No animation)</option>
								</select>
							</div>

							{/* Smooth Cursor Movement */}
							<div className="flex items-center justify-between">
								<div>
									<div className="font-medium text-gray-900 dark:text-gray-100">
										Smooth Cursor Movement
									</div>
									<div className="text-sm text-gray-500 dark:text-gray-400">
										Animate cursor position changes
									</div>
								</div>
								<button
									onClick={() => updateSetting("cursorSmoothMovement", !editorSettings.cursorSmoothMovement)}
									className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
										editorSettings.cursorSmoothMovement ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
									}`}
								>
									<span
										className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
											editorSettings.cursorSmoothMovement ? "translate-x-6" : "translate-x-1"
										}`}
									/>
								</button>
							</div>
						</div>

						{/* Reset Button */}
						<div className="pt-4 border-t border-gray-200 dark:border-gray-700">
							<button
								onClick={resetSettings}
								className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
							>
								Reset to Defaults
							</button>
						</div>
					</div>
				</section>

				{/* Backup & Restore Section */}
				<section className="space-y-4">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
						<Icons.Save className="w-5 h-5" />
						Backup & Restore
					</h2>

					<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
						<div>
							<div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
								Settings Backup
							</div>
							<div className="text-sm text-gray-500 dark:text-gray-400 mb-3">
								Export your settings to a JSON file or import from a backup
							</div>
							<div className="flex gap-3">
								<button
									onClick={handleExportSettings}
									disabled={isExporting}
									className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
								>
									<Icons.Download className="w-4 h-4" />
									{isExporting ? "Exporting..." : "Export Settings"}
								</button>
								<button
									onClick={handleImportSettings}
									disabled={isImporting}
									className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
								>
									<Icons.Upload className="w-4 h-4" />
									{isImporting ? "Importing..." : "Import Settings"}
								</button>
							</div>
						</div>

						<div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
							<Icons.Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
							<div className="text-sm text-blue-800 dark:text-blue-200">
								Settings are automatically saved in your notes database and will persist across app reinstalls.
							</div>
						</div>
					</div>
				</section>

				{/* About Section */}
				<section className="space-y-4">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
						<Icons.Info className="w-5 h-5" />
						About
					</h2>

					<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
						<div className="flex items-center justify-between">
							<span className="text-gray-600 dark:text-gray-400">
								Application
							</span>
							<span className="font-medium text-gray-900 dark:text-gray-100">
								IrisNotes
							</span>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-gray-600 dark:text-gray-400">
								Environment
							</span>
							<span className="font-medium text-gray-900 dark:text-gray-100">
								{import.meta.env.DEV ? "Development" : "Production"}
							</span>
						</div>
					</div>
				</section>

				{/* Debug Section (Dev Only) */}
				{import.meta.env.DEV && (
					<section className="space-y-4">
						<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
							<Icons.Bug className="w-5 h-5" />
							Debug Info
						</h2>

						<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
							<pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-64">
								{JSON.stringify(config, null, 2)}
							</pre>
						</div>
					</section>
				)}
			</div>
		</div>
	);
}

// Custom font picker dropdown for settings view (matches toolbar/picker dialog UI)
function SettingsFontPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [filter, setFilter] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const currentFont = FONT_FAMILIES.find((f) => f.value === value);
	const currentLabel = currentFont?.label || "Sans Serif";

	const isFiltering = filter.length > 0;
	const filteredFonts = isFiltering
		? FONT_FAMILIES.filter((f) => f.label.toLowerCase().includes(filter.toLowerCase()))
		: FONT_FAMILIES;
	const groupedFonts = getFontsByGroup();
	const totalItems = filteredFonts.length;

	// Focus filter input when dropdown opens
	useEffect(() => {
		if (isOpen) {
			setFilter("");
			setSelectedIndex(0);
			requestAnimationFrame(() => inputRef.current?.focus());
		}
	}, [isOpen]);

	useEffect(() => {
		setSelectedIndex(0);
	}, [filter]);

	// Scroll selected into view
	useEffect(() => {
		if (isOpen && dropdownRef.current) {
			const el = dropdownRef.current.querySelector(`[data-index="${selectedIndex}"]`);
			el?.scrollIntoView({ block: "nearest" });
		}
	}, [isOpen, selectedIndex]);

	// Close on outside click
	useEffect(() => {
		if (!isOpen) return;
		const handle = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		};
		document.addEventListener("mousedown", handle);
		return () => document.removeEventListener("mousedown", handle);
	}, [isOpen]);

	const applyFont = useCallback((font: typeof FONT_FAMILIES[number]) => {
		onChange(font.value);
		setIsOpen(false);
	}, [onChange]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!isOpen) return;
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				setSelectedIndex((prev) => Math.min(prev + 1, totalItems - 1));
				break;
			case "ArrowUp":
				e.preventDefault();
				setSelectedIndex((prev) => Math.max(prev - 1, 0));
				break;
			case "Enter":
				e.preventDefault();
				if (filteredFonts[selectedIndex]) applyFont(filteredFonts[selectedIndex]);
				break;
			case "Escape":
				e.preventDefault();
				setIsOpen(false);
				break;
		}
	};

	const renderFontButton = (font: typeof FONT_FAMILIES[number], index: number) => {
		const isCurrent = value === font.value;
		const isMono = font.group === "monospace";
		return (
			<button
				key={font.value}
				type="button"
				data-index={index}
				className={`w-full flex items-center justify-between px-3 py-1.5 text-sm transition-colors ${
					index === selectedIndex
						? "bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100"
						: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
				} ${isCurrent ? "font-semibold" : ""}`}
				style={{ fontFamily: font.value }}
				onClick={() => applyFont(font)}
				onMouseEnter={() => setSelectedIndex(index)}
			>
				<span>{font.label}</span>
				{isMono && (
					<span className="ml-2 text-[10px] px-1 py-0 rounded bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 font-normal font-sans leading-tight">
						mono
					</span>
				)}
			</button>
		);
	};

	return (
		<div className="relative" ref={containerRef}>
			<button
				type="button"
				className={`flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border text-gray-900 dark:text-gray-100 text-sm cursor-pointer transition-colors ${
					isOpen ? "border-blue-500 ring-2 ring-blue-500" : "border-gray-200 dark:border-gray-600 hover:border-blue-500"
				}`}
				style={{ fontFamily: value }}
				onClick={() => setIsOpen(!isOpen)}
			>
				<span>{currentLabel}</span>
				<Icons.ChevronDown size={14} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
			</button>
			{isOpen && (
				<div
					ref={dropdownRef}
					className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[220px] max-h-[300px] overflow-hidden flex flex-col"
					onKeyDown={handleKeyDown}
				>
					{/* Filter input */}
					<div className="px-2 pt-2 pb-1 border-b border-gray-200 dark:border-gray-700">
						<input
							ref={inputRef}
							type="text"
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
							placeholder="Type to filter..."
							className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
						/>
					</div>
					<div className="overflow-y-auto">
						{isFiltering ? (
							<>
								{filteredFonts.map((font, index) => renderFontButton(font, index))}
								{filteredFonts.length === 0 && (
									<div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500 italic">
										No fonts match &quot;{filter}&quot;
									</div>
								)}
							</>
						) : (
							groupedFonts.map((g, gIdx) => (
								<div key={g.group}>
									<div
										className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 select-none ${
											gIdx > 0 ? "border-t border-gray-200 dark:border-gray-700 mt-0.5" : ""
										}`}
									>
										{g.label}
									</div>
									{g.fonts.map((font) => {
										const globalIndex = FONT_FAMILIES.indexOf(font);
										return renderFontButton(font, globalIndex);
									})}
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}
