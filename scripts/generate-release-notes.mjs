import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const tauriConfigPath = resolve(repoRoot, "apps/main/src-tauri/tauri.conf.json");
const outputPath = resolve(repoRoot, "apps/main/src/data/current-release-notes.json");

function runGit(args) {
	try {
		return execFileSync("git", args, {
			cwd: repoRoot,
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
		}).trim();
	} catch {
		return "";
	}
}

function getVersion() {
	const config = JSON.parse(readFileSync(tauriConfigPath, "utf8"));
	return typeof config.version === "string" ? config.version : "0.0.0";
}

function getReleaseBumps() {
	const log = runGit(["log", "--format=%H%x00%s"]);
	if (!log) return [];

	return log
		.split("\n")
		.map((line) => {
			const [hash, subject] = line.split("\0");
			return hash && subject ? { hash, subject } : null;
		})
		.filter((entry) => entry && /^chore\(release\): bump apps to /.test(entry.subject));
}

function getTagRange(version) {
	const currentTag = `v${version}`;
	const currentTagHash = runGit(["rev-parse", "--verify", `refs/tags/${currentTag}^{commit}`]);
	if (!currentTagHash) return null;

	const previousTag = runGit(["describe", "--tags", "--abbrev=0", "--match", "v*", `${currentTag}^`]);
	if (!previousTag) return { revision: currentTag, label: currentTag };

	return {
		revision: `${previousTag}..${currentTag}`,
		label: `${previousTag}..${currentTag}`,
	};
}

function getReleaseBumpRange(version) {
	const releaseBumps = getReleaseBumps();
	if (releaseBumps.length === 0) return null;

	const currentBumpIndex = releaseBumps.findIndex((entry) => entry.subject === `chore(release): bump apps to ${version}`);
	if (currentBumpIndex >= 0) {
		const previousBump = releaseBumps[currentBumpIndex + 1];
		if (previousBump) {
			return {
				revision: `${previousBump.hash}..HEAD`,
				label: `${previousBump.hash.slice(0, 7)}..HEAD`,
			};
		}
	}

	const latestBump = releaseBumps[0];
	return {
		revision: `${latestBump.hash}..HEAD`,
		label: `${latestBump.hash.slice(0, 7)}..HEAD`,
	};
}

function getFallbackRange() {
	const hasHistory = runGit(["rev-parse", "--verify", "HEAD"]);
	if (!hasHistory) return null;

	const olderCommit = runGit(["rev-parse", "--verify", "HEAD~12"]);
	if (olderCommit) {
		return { revision: "HEAD~12..HEAD", label: "HEAD~12..HEAD" };
	}

	return { revision: "HEAD", label: "HEAD" };
}

function getReleaseRange(version) {
	return getTagRange(version) ?? getReleaseBumpRange(version) ?? getFallbackRange();
}

function getCommitSubjects(revision) {
	if (!revision) return [];
	const log = runGit(["log", "--no-merges", "--format=%s", revision]);
	if (!log) return [];

	return log.split("\n").filter(Boolean).reverse();
}

function parseSubject(subject) {
	const conventional = subject.match(/^(\w+)(?:\(([^)]+)\))?!?:\s+(.+)$/);
	if (!conventional) {
		return { type: "other", scope: null, text: subject };
	}

	return {
		type: conventional[1].toLowerCase(),
		scope: conventional[2] ?? null,
		text: conventional[3],
	};
}

function capitalize(text) {
	return text.length === 0 ? text : `${text[0].toUpperCase()}${text.slice(1)}`;
}

function formatSubject(subject) {
	const parsed = parseSubject(subject);
	const text = capitalize(parsed.text.replace(/[.\s]+$/, ""));
	return parsed.scope ? `${capitalize(parsed.scope)}: ${text}` : text;
}

function sectionForSubject(subject) {
	const { type } = parseSubject(subject);
	if (type === "feat") return "Features";
	if (type === "fix") return "Fixes";
	if (["perf", "refactor", "style"].includes(type)) return "Improvements";
	return null;
}

function buildSections(subjects) {
	const grouped = new Map([
		["Features", []],
		["Fixes", []],
		["Improvements", []],
	]);

	for (const subject of subjects) {
		if (/^chore\(release\): bump apps to /.test(subject)) continue;
		const sectionTitle = sectionForSubject(subject);
		if (!sectionTitle) continue;

		const items = grouped.get(sectionTitle);
		items.push(formatSubject(subject));
	}

	return Array.from(grouped.entries())
		.filter(([, items]) => items.length > 0)
		.map(([title, items]) => ({ title, items: items.slice(0, 8) }));
}

const version = getVersion();
let releaseRange = getReleaseRange(version);
let subjects = getCommitSubjects(releaseRange?.revision);
let sections = buildSections(subjects);

if (sections.length === 0) {
	const fallbackRange = getFallbackRange();
	const fallbackSubjects = getCommitSubjects(fallbackRange?.revision);
	const fallbackSections = buildSections(fallbackSubjects);

	if (fallbackSections.length > 0) {
		releaseRange = fallbackRange;
		subjects = fallbackSubjects;
		sections = fallbackSections;
	}
}

const releaseNotes = {
	version,
	range: releaseRange?.label ?? "unknown",
	sections,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(releaseNotes, null, "\t")}\n`);

console.log(`Generated release notes for IrisNotes v${version} (${releaseNotes.range})`);