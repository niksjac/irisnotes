import { useState, useEffect } from "react";
import { useAtom } from "jotai";
import * as Icons from "lucide-react";
import { getVersion } from "@tauri-apps/api/app";
import {
	brandingSettingsAtom,
	getBrandingLogo,
	LOGO_OPTIONS,
	type LogoVariant,
} from "@/atoms/settings";
import currentReleaseNotes from "@/data/current-release-notes.json";

interface ReleaseNotesSection {
	title: string;
	items: string[];
}

interface CurrentReleaseNotes {
	version: string;
	range: string;
	sections: ReleaseNotesSection[];
}

const releaseNotes = currentReleaseNotes as CurrentReleaseNotes;

function LogoPicker({
	value,
	onChange,
}: {
	value: LogoVariant;
	onChange: (v: LogoVariant) => void;
}) {
	return (
		<div className="grid grid-cols-4 gap-3">
			{LOGO_OPTIONS.map((opt) => (
				<button
					key={opt.id}
					onClick={() => onChange(opt.id)}
					className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all cursor-pointer ${
						value === opt.id
							? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
							: "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
					}`}
				>
					<div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded">
						<img
							src={opt.file}
							alt={opt.label}
							className="w-8 h-8 object-contain"
						/>
					</div>
					<span className="text-[10px] text-gray-600 dark:text-gray-400 text-center leading-tight">
						{opt.label}
					</span>
				</button>
			))}
		</div>
	);
}

export function BrandingView() {
	const [branding, setBranding] = useAtom(brandingSettingsAtom);
	const [appVersion, setAppVersion] = useState<string | null>(null);
	const hasReleaseNotes = releaseNotes.sections.some((section) => section.items.length > 0);

	useEffect(() => {
		getVersion().then(setAppVersion).catch(() => setAppVersion(null));
	}, []);

	const currentLogo = getBrandingLogo(branding);

	return (
		<div className="h-full overflow-auto bg-white dark:bg-gray-900">
			<div className="max-w-4xl mx-auto p-4 space-y-6">
				{/* Header with current logo */}
				<div className="border-b border-gray-200 dark:border-gray-700 pb-4">
					<div className="flex items-center gap-4">
						<img
							src={currentLogo.file}
							alt="IrisNotes"
							className="w-12 h-12 object-contain"
						/>
						<div>
							<h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
								IrisNotes
								{import.meta.env.DEV && (
									<span className="text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded leading-none">DEV</span>
								)}
							</h1>
						</div>
					</div>
				</div>

				{/* Icon */}
				<section>
					<h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
						<Icons.Palette className="w-4 h-4" />
						Icon
					</h2>
					<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
						<LogoPicker
							value={currentLogo.id}
							onChange={(logo) => setBranding({ logo })}
						/>
					</div>
					<p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
						Shown in the title bar and as the Quick Search tray icon.
					</p>
				</section>

				{/* About Info */}
				<section>
					<h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
						<Icons.Info className="w-4 h-4" />
						Version
					</h2>
					<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
						{appVersion && (
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-600 dark:text-gray-400">Version</span>
								<span className="text-sm font-medium text-gray-900 dark:text-gray-100">{appVersion}</span>
							</div>
						)}
						<div className="flex items-center justify-between">
							<span className="text-sm text-gray-600 dark:text-gray-400">Environment</span>
							<span className="text-sm font-medium text-gray-900 dark:text-gray-100">
								{import.meta.env.DEV ? "Development" : "Production"}
							</span>
						</div>
						{hasReleaseNotes && (
							<div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 space-y-2">
								<div className="text-sm text-gray-600 dark:text-gray-400">In This Version</div>
								<div className="space-y-2">
									{releaseNotes.sections.map((section) => (
										<div key={section.title} className="space-y-1">
											<div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
												{section.title}
											</div>
											<ul className="space-y-1">
												{section.items.map((item) => (
													<li key={item} className="flex gap-2 text-sm text-gray-700 dark:text-gray-300">
														<span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-400 dark:bg-gray-500" />
														<span>{item}</span>
													</li>
												))}
											</ul>
										</div>
									))}
								</div>
							</div>
						)}
					</div>
				</section>
			</div>
		</div>
	);
}
