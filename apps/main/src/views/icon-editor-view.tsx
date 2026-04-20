import { useState, useRef, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import * as Icons from "lucide-react";

// Preset colors for quick selection
const FILL_PRESETS = [
	{ label: "None", value: "none" },
	{ label: "Black", value: "#000000" },
	{ label: "White", value: "#ffffff" },
	{ label: "Purple", value: "#7c3aed" },
	{ label: "Blue", value: "#3b82f6" },
	{ label: "Periwinkle", value: "#818cf8" },
	{ label: "Indigo", value: "#4f46e5" },
	{ label: "Rose", value: "#e11d48" },
	{ label: "Emerald", value: "#10b981" },
	{ label: "Amber", value: "#f59e0b" },
	{ label: "Slate", value: "#64748b" },
];

const STROKE_PRESETS = [
	{ label: "None", value: "none" },
	{ label: "Black", value: "#000000" },
	{ label: "White", value: "#ffffff" },
	{ label: "Purple", value: "#7c3aed" },
	{ label: "Blue", value: "#3b82f6" },
	{ label: "Gray", value: "#6b7280" },
];

// The raw SVG path data from assets/logo-transparent.svg — loaded at runtime
const SVG_VIEWBOX = "0 0 63.04 66.88";
const SVG_WIDTH = 63.04;
const SVG_HEIGHT = 66.88;

interface IconState {
	fill: string;
	fillOpacity: number;
	stroke: string;
	strokeWidth: number;
	bgColor: string;
}

const DEFAULT_STATE: IconState = {
	fill: "#000000",
	fillOpacity: 1,
	stroke: "none",
	strokeWidth: 0,
	bgColor: "none",
};

function ColorSwatch({
	color,
	selected,
	onClick,
	label,
}: {
	color: string;
	selected: boolean;
	onClick: () => void;
	label: string;
}) {
	const isNone = color === "none";
	return (
		<button
			type="button"
			title={label}
			onClick={onClick}
			className={`w-7 h-7 rounded border-2 transition-all cursor-pointer relative ${
				selected
					? "border-blue-500 ring-1 ring-blue-500/50"
					: "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
			}`}
			style={isNone ? undefined : { backgroundColor: color }}
		>
			{isNone && (
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="w-5 h-[2px] bg-red-400 rotate-45 absolute" />
				</div>
			)}
		</button>
	);
}

function buildSvgString(pathData: string, state: IconState): string {
	const style = [
		`fill:${state.fill}`,
		`fill-opacity:${state.fillOpacity}`,
		state.stroke !== "none" ? `stroke:${state.stroke}` : null,
		state.strokeWidth > 0 ? `stroke-width:${state.strokeWidth}` : null,
		state.strokeWidth > 0 ? "stroke-linejoin:round" : null,
		state.strokeWidth > 0 ? "stroke-linecap:round" : null,
	]
		.filter(Boolean)
		.join(";");

	const bgRect =
		state.bgColor !== "none"
			? `<rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" fill="${state.bgColor}" rx="4" />`
			: "";

	return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${SVG_VIEWBOX}" width="${SVG_WIDTH}" height="${SVG_HEIGHT}">
${bgRect}<path style="${style}" d="${pathData}" />
</svg>`;
}

export function IconEditorView() {
	const [pathData, setPathData] = useState<string | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [state, setState] = useState<IconState>(DEFAULT_STATE);
	const [customFill, setCustomFill] = useState("#7c3aed");
	const [customStroke, setCustomStroke] = useState("#000000");
	const [applyStatus, setApplyStatus] = useState<string | null>(null);
	const [applyError, setApplyError] = useState<string | null>(null);
	const previewRef = useRef<HTMLDivElement>(null);

	// Load SVG path data from the source file
	useEffect(() => {
		fetch("/logo-transparent.svg")
			.then((r) => r.text())
			.then((svg) => {
				// Extract the d="" attribute from the <path> element
				const match = svg.match(/ d="([^"]+)"/);
				if (match?.[1]) {
					setPathData(match[1]);
				} else {
					setLoadError("Could not extract path data from SVG");
				}
			})
			.catch((e) => setLoadError(`Failed to load SVG: ${e}`));
	}, []);

	const update = useCallback(
		<K extends keyof IconState>(key: K, value: IconState[K]) => {
			setState((prev) => ({ ...prev, [key]: value }));
			setApplyStatus(null);
			setApplyError(null);
		},
		[],
	);

	const svgString = pathData ? buildSvgString(pathData, state) : null;
	const svgDataUrl = svgString
		? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`
		: null;

	const handleApply = useCallback(
		async (target: "taskbar" | "tray" | "app") => {
			if (!svgString) return;
			setApplyStatus(null);
			setApplyError(null);

			try {
				switch (target) {
					case "taskbar": {
						const iconName = import.meta.env.DEV
							? "irisnotes-dev"
							: "irisnotes";
						const result = await invoke<string>("install_icon_to_hicolor", {
							svgContent: svgString,
							iconName,
						});
						setApplyStatus(result);
						break;
					}
					case "tray": {
						const result = await invoke<string>("save_custom_tray_svg", {
							svgContent: svgString,
						});
						setApplyStatus(`Saved tray icon to ${result}. Restart Quick Search to apply.`);
						break;
					}
					case "app": {
						const filename = await invoke<string>("save_custom_app_logo", {
							svgContent: svgString,
						});
						setApplyStatus(`Saved as ${filename}. Select "Custom" in Branding to use it.`);
						break;
					}
				}
			} catch (e) {
				setApplyError(String(e));
			}
		},
		[svgString],
	);

	if (loadError) {
		return (
			<div className="h-full flex items-center justify-center text-red-400">
				<Icons.AlertTriangle className="w-5 h-5 mr-2" />
				{loadError}
			</div>
		);
	}

	if (!pathData) {
		return (
			<div className="h-full flex items-center justify-center text-gray-400">
				Loading SVG…
			</div>
		);
	}

	return (
		<div className="h-full overflow-auto bg-white dark:bg-gray-900">
			<div className="max-w-4xl mx-auto p-4 space-y-6">
				{/* Header */}
				<div className="border-b border-gray-200 dark:border-gray-700 pb-4">
					<h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
						<Icons.Brush className="w-5 h-5" />
						Icon Editor
					</h1>
					<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
						Customize the iris logo colors and apply to taskbar, system tray, or in-app.
					</p>
				</div>

				<div className="flex gap-6 flex-col lg:flex-row">
					{/* Preview */}
					<div className="flex-shrink-0">
						<div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
							Preview
						</div>
						<div
							ref={previewRef}
							className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 flex items-center justify-center border border-gray-200 dark:border-gray-700"
						>
							{svgDataUrl && (
								<div className="space-y-4 flex flex-col items-center">
									{/* Large preview */}
									<img
										src={svgDataUrl}
										alt="Icon preview"
										className="w-48 h-48 object-contain"
									/>
									{/* Small previews showing how it looks at icon sizes */}
									<div className="flex items-end gap-4">
										<div className="text-center">
											<img
												src={svgDataUrl}
												alt="16px"
												className="w-4 h-4 object-contain mx-auto"
											/>
											<span className="text-[9px] text-gray-400 mt-1 block">
												16
											</span>
										</div>
										<div className="text-center">
											<img
												src={svgDataUrl}
												alt="32px"
												className="w-8 h-8 object-contain mx-auto"
											/>
											<span className="text-[9px] text-gray-400 mt-1 block">
												32
											</span>
										</div>
										<div className="text-center">
											<img
												src={svgDataUrl}
												alt="48px"
												className="w-12 h-12 object-contain mx-auto"
											/>
											<span className="text-[9px] text-gray-400 mt-1 block">
												48
											</span>
										</div>
										<div className="text-center">
											<img
												src={svgDataUrl}
												alt="64px"
												className="w-16 h-16 object-contain mx-auto"
											/>
											<span className="text-[9px] text-gray-400 mt-1 block">
												64
											</span>
										</div>
									</div>
								</div>
							)}
						</div>
					</div>

					{/* Controls */}
					<div className="flex-1 space-y-5">
						{/* Fill Color */}
						<section>
							<div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5">
								Fill Color
							</div>
							<div className="flex flex-wrap gap-1.5 mb-2">
								{FILL_PRESETS.map((p) => (
									<ColorSwatch
										key={p.value}
										color={p.value}
										selected={state.fill === p.value}
										onClick={() => update("fill", p.value)}
										label={p.label}
									/>
								))}
							</div>
							<div className="flex items-center gap-2">
								<label className="text-xs text-gray-500 dark:text-gray-400">
									Custom:
								</label>
								<input
									type="color"
									value={customFill}
									onChange={(e) => {
										setCustomFill(e.target.value);
										update("fill", e.target.value);
									}}
									className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
								/>
								<input
									type="text"
									value={state.fill}
									onChange={(e) => update("fill", e.target.value)}
									className="text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-24 font-mono"
									placeholder="#hex or none"
								/>
							</div>
						</section>

						{/* Fill Opacity */}
						<section>
							<div className="flex items-center justify-between mb-1">
								<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
									Fill Opacity
								</span>
								<span className="text-xs text-gray-400 font-mono">
									{state.fillOpacity.toFixed(2)}
								</span>
							</div>
							<input
								type="range"
								min="0"
								max="1"
								step="0.05"
								value={state.fillOpacity}
								onChange={(e) =>
									update("fillOpacity", Number.parseFloat(e.target.value))
								}
								className="w-full accent-blue-500"
							/>
						</section>

						{/* Stroke Color */}
						<section>
							<div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5">
								Stroke Color
							</div>
							<div className="flex flex-wrap gap-1.5 mb-2">
								{STROKE_PRESETS.map((p) => (
									<ColorSwatch
										key={p.value}
										color={p.value}
										selected={state.stroke === p.value}
										onClick={() => update("stroke", p.value)}
										label={p.label}
									/>
								))}
							</div>
							<div className="flex items-center gap-2">
								<label className="text-xs text-gray-500 dark:text-gray-400">
									Custom:
								</label>
								<input
									type="color"
									value={customStroke}
									onChange={(e) => {
										setCustomStroke(e.target.value);
										update("stroke", e.target.value);
									}}
									className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
								/>
								<input
									type="text"
									value={state.stroke}
									onChange={(e) => update("stroke", e.target.value)}
									className="text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-24 font-mono"
									placeholder="#hex or none"
								/>
							</div>
						</section>

						{/* Stroke Width */}
						<section>
							<div className="flex items-center justify-between mb-1">
								<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
									Stroke Width
								</span>
								<span className="text-xs text-gray-400 font-mono">
									{state.strokeWidth.toFixed(1)}
								</span>
							</div>
							<input
								type="range"
								min="0"
								max="3"
								step="0.1"
								value={state.strokeWidth}
								onChange={(e) =>
									update("strokeWidth", Number.parseFloat(e.target.value))
								}
								className="w-full accent-blue-500"
							/>
						</section>

						{/* Background Color */}
						<section>
							<div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1.5">
								Background
							</div>
							<div className="flex items-center gap-2">
								<ColorSwatch
									color="none"
									selected={state.bgColor === "none"}
									onClick={() => update("bgColor", "none")}
									label="Transparent"
								/>
								<ColorSwatch
									color="#ffffff"
									selected={state.bgColor === "#ffffff"}
									onClick={() => update("bgColor", "#ffffff")}
									label="White"
								/>
								<ColorSwatch
									color="#1e1e2e"
									selected={state.bgColor === "#1e1e2e"}
									onClick={() => update("bgColor", "#1e1e2e")}
									label="Dark"
								/>
								<input
									type="color"
									value={state.bgColor === "none" ? "#ffffff" : state.bgColor}
									onChange={(e) => update("bgColor", e.target.value)}
									className="w-7 h-7 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
								/>
							</div>
						</section>

						{/* Reset */}
						<button
							type="button"
							onClick={() => setState(DEFAULT_STATE)}
							className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline cursor-pointer"
						>
							Reset to defaults
						</button>
					</div>
				</div>

				{/* Apply Section */}
				<section className="border-t border-gray-200 dark:border-gray-700 pt-4">
					<h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
						<Icons.Download className="w-4 h-4" />
						Apply Icon
					</h2>
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<button
							type="button"
							onClick={() => handleApply("taskbar")}
							className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
						>
							<Icons.AppWindow className="w-4 h-4 text-blue-500" />
							<div className="text-left">
								<div className="text-sm font-medium text-gray-900 dark:text-gray-100">
									Taskbar Icon
								</div>
								<div className="text-[10px] text-gray-500">
									Install to hicolor theme
								</div>
							</div>
						</button>
						<button
							type="button"
							onClick={() => handleApply("tray")}
							className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
						>
							<Icons.MonitorCog className="w-4 h-4 text-purple-500" />
							<div className="text-left">
								<div className="text-sm font-medium text-gray-900 dark:text-gray-100">
									System Tray
								</div>
								<div className="text-[10px] text-gray-500">
									Quick Search tray icon
								</div>
							</div>
						</button>
						<button
							type="button"
							onClick={() => handleApply("app")}
							className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors cursor-pointer"
						>
							<Icons.Palette className="w-4 h-4 text-emerald-500" />
							<div className="text-left">
								<div className="text-sm font-medium text-gray-900 dark:text-gray-100">
									In-App Logo
								</div>
								<div className="text-[10px] text-gray-500">
									Activity bar logo
								</div>
							</div>
						</button>
					</div>

					{applyStatus && (
						<div className="mt-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
							<Icons.Check className="w-4 h-4 inline mr-1" />
							{applyStatus}
						</div>
					)}
					{applyError && (
						<div className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
							<Icons.AlertTriangle className="w-4 h-4 inline mr-1" />
							{applyError}
						</div>
					)}

					<p className="text-xs text-gray-400 mt-3">
						Taskbar: writes PNGs (32–512px) + SVG to{" "}
						<code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[10px]">
							~/.local/share/icons/hicolor/
						</code>
						. Restart your panel/bar to see changes.
					</p>
				</section>
			</div>
		</div>
	);
}
