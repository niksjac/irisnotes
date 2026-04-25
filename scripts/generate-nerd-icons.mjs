#!/usr/bin/env node
/**
 * Generate nerd-font-icons.ts from Nerd Fonts glyphnames.json.
 *
 * Usage:
 *   node scripts/generate-nerd-icons.mjs [path/to/glyphnames.json]
 *
 * Default source: https://raw.githubusercontent.com/ryanoasis/nerd-fonts/v3.3.0/glyphnames.json
 * Output:         apps/main/src/data/nerd-font-icons.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const NF_VERSION = "3.3.0";
const GLYPHNAMES_URL = `https://raw.githubusercontent.com/ryanoasis/nerd-fonts/v${NF_VERSION}/glyphnames.json`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(REPO_ROOT, "apps/main/src/data/nerd-font-icons.ts");

const PREFIX_CATEGORY = {
	cod: "Codicons",
	fa: "Font Awesome",
	fae: "Font Awesome Extension",
	dev: "Devicons",
	iec: "IEC Power",
	linux: "Linux",
	md: "Material Design",
	oct: "Octicons",
	pl: "Powerline",
	ple: "Powerline Extra",
	pom: "Pomicons",
	seti: "Seti UI",
	weather: "Weather",
	custom: "Custom",
	indent: "Indent",
	indentation: "Indent",
	extra: "Extras",
};

async function loadSource() {
	const arg = process.argv[2];
	if (arg && fs.existsSync(arg)) {
		return JSON.parse(fs.readFileSync(arg, "utf8"));
	}
	const res = await fetch(GLYPHNAMES_URL);
	if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
	return res.json();
}

function buildKeywords(name, category) {
	// "fa-github_alt" → "github alt font awesome"
	const stripped = name.replace(/^[a-z]+-/, "");
	const words = stripped.split(/[-_]/).filter(Boolean);
	return [...new Set([...words, category.toLowerCase()])].join(" ");
}

function prettyName(rawName) {
	const stripped = rawName.replace(/^[a-z]+-/, "");
	return stripped.replace(/[-_]/g, " ");
}

async function main() {
	const data = await loadSource();
	const metadata = data.METADATA || {};
	delete data.METADATA;

	const entries = [];
	for (const [key, val] of Object.entries(data)) {
		if (!val || typeof val !== "object") continue;
		const { char, code } = val;
		if (!char || !code) continue;
		const prefixMatch = key.match(/^([a-z]+)-/);
		const prefix = prefixMatch ? prefixMatch[1] : "other";
		const category = PREFIX_CATEGORY[prefix] || "Other";
		entries.push({
			char,
			code: code.toUpperCase(),
			name: prettyName(key),
			keywords: buildKeywords(key, category),
			category,
		});
	}

	entries.sort((a, b) => {
		if (a.category !== b.category) return a.category.localeCompare(b.category);
		return a.name.localeCompare(b.name);
	});

	const categories = [...new Set(entries.map((e) => e.category))].sort();

	const escapeChar = (c) => {
		const cp = c.codePointAt(0) ?? 0;
		return `"\\u${cp.toString(16).toUpperCase().padStart(4, "0")}"`;
	};
	const escapeStr = (s) => JSON.stringify(s);

	const lines = [];
	lines.push("/**");
	lines.push(" * AUTO-GENERATED — DO NOT EDIT BY HAND.");
	lines.push(" * Source: Nerd Fonts glyphnames.json");
	lines.push(` * Version: ${metadata.version || NF_VERSION}`);
	lines.push(` * Date: ${metadata.date || "unknown"}`);
	lines.push(" * Regenerate via: node scripts/generate-nerd-icons.mjs");
	lines.push(" */");
	lines.push("");
	lines.push("export interface NerdFontIcon {");
	lines.push("\tchar: string;");
	lines.push("\tcode: string;");
	lines.push("\tname: string;");
	lines.push("\tkeywords: string;");
	lines.push("\tcategory: string;");
	lines.push("}");
	lines.push("");
	lines.push(`export const NERD_FONT_VERSION = ${JSON.stringify(metadata.version || NF_VERSION)};`);
	lines.push("");
	lines.push(`export const NERD_FONT_CATEGORIES: readonly string[] = ${JSON.stringify(categories)};`);
	lines.push("");
	lines.push("export const NERD_FONT_ICONS: readonly NerdFontIcon[] = [");
	for (const e of entries) {
		lines.push(
			`\t{ char: ${escapeChar(e.char)}, code: ${escapeStr(e.code)}, name: ${escapeStr(e.name)}, keywords: ${escapeStr(e.keywords)}, category: ${escapeStr(e.category)} },`,
		);
	}
	lines.push("];");
	lines.push("");

	fs.writeFileSync(OUT_PATH, lines.join("\n"));
	console.log(`Wrote ${entries.length} icons across ${categories.length} categories → ${path.relative(REPO_ROOT, OUT_PATH)}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
