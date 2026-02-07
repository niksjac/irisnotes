#!/usr/bin/env bun
import { Command } from "commander";
import chalk from "chalk";
import { spawn } from "child_process";
import { platform } from "os";
import { join } from "path";
import { existsSync } from "fs";
import {
	getAllNotes,
	getAllItems,
	getItemById,
	findNotesByTitle,
	searchNotes,
	getItemPath,
	closeDatabase,
	type NoteItem,
} from "./db";

const program = new Command();

program
	.name("iris")
	.description("IrisNotes CLI - Command-line interface for your notes")
	.version("0.1.0");

// ============================================================================
// LIST COMMAND
// ============================================================================
program
	.command("list")
	.alias("ls")
	.description("List all notes")
	.option("-a, --all", "Include books and sections")
	.option("-n, --notes-only", "Show only notes (default)")
	.option("-j, --json", "Output as JSON")
	.option("-i, --with-id", "Show note IDs")
	.option("-l, --limit <n>", "Limit number of results", "50")
	.action((options) => {
		try {
			const items = options.all ? getAllItems() : getAllNotes();
			const limited = items.slice(0, parseInt(options.limit));

			if (options.json) {
				console.log(JSON.stringify(limited, null, 2));
				return;
			}

			if (limited.length === 0) {
				console.log(chalk.yellow("No notes found."));
				return;
			}

			console.log(chalk.bold(`\n📓 Notes (${limited.length}${items.length > limited.length ? ` of ${items.length}` : ""})\n`));

			for (const item of limited) {
				const icon = item.type === "book" ? "📚" : item.type === "section" ? "📁" : "📄";
				const path = getItemPath(item);
				const date = new Date(item.updated_at).toLocaleDateString();

				if (options.withId) {
					console.log(`${icon} ${chalk.cyan(item.id.slice(0, 8))} ${path} ${chalk.gray(`(${date})`)}`);
				} else {
					console.log(`${icon} ${path} ${chalk.gray(`(${date})`)}`);
				}
			}
			console.log();
		} catch (error) {
			console.error(chalk.red("Error:"), (error as Error).message);
			process.exit(1);
		} finally {
			closeDatabase();
		}
	});

// ============================================================================
// SEARCH COMMAND
// ============================================================================
program
	.command("search <query>")
	.alias("s")
	.description("Search notes by title or content")
	.option("-l, --limit <n>", "Maximum results", "15")
	.option("-j, --json", "Output as JSON")
	.option("-i, --with-id", "Show note IDs")
	.action((query, options) => {
		try {
			const results = searchNotes(query, parseInt(options.limit));

			if (options.json) {
				console.log(JSON.stringify(results, null, 2));
				return;
			}

			if (results.length === 0) {
				console.log(chalk.yellow(`\nNo results for "${query}"\n`));
				return;
			}

			console.log(chalk.bold(`\n🔍 Found ${results.length} match${results.length > 1 ? "es" : ""} for "${query}"\n`));

			for (let i = 0; i < results.length; i++) {
				const result = results[i];
				if (!result) continue;

				const num = chalk.gray(`[${i + 1}]`);
				const title = chalk.bold.white(result.title);
				const id = options.withId ? chalk.cyan(` (${result.id.slice(0, 8)})`) : "";

				console.log(`${num} ${title}${id}`);

				if (result.parent_path) {
					console.log(`    ${chalk.gray("📂")} ${chalk.gray(result.parent_path)}`);
				}

				if (result.snippet) {
					// Highlight matches in snippet
					const highlighted = result.snippet
						.replace(/>>>/g, chalk.bgYellow.black(""))
						.replace(/<<</g, chalk.reset(""));
					console.log(`    ${chalk.gray(highlighted)}`);
				}

				console.log();
			}
		} catch (error) {
			console.error(chalk.red("Error:"), (error as Error).message);
			process.exit(1);
		} finally {
			closeDatabase();
		}
	});

// ============================================================================
// Helper: Launch IrisNotes with a note
// ============================================================================
function launchIrisNotes(noteId: string): void {
	const os = platform();
	let command: string;
	let args: string[];

	if (os === "linux") {
		// Try development binary first, then PATH
		const devBinary = join(import.meta.dir, "..", "..", "main", "src-tauri", "target", "debug", "irisnotes");
		const releaseBinary = join(import.meta.dir, "..", "..", "main", "src-tauri", "target", "release", "irisnotes");
		
		if (existsSync(devBinary)) {
			command = devBinary;
		} else if (existsSync(releaseBinary)) {
			command = releaseBinary;
		} else {
			// Fall back to PATH
			command = "irisnotes";
		}
		args = [`--open-note=${noteId}`];
	} else if (os === "darwin") {
		command = "open";
		args = ["-a", "IrisNotes", "--args", `--open-note=${noteId}`];
	} else if (os === "win32") {
		command = "cmd";
		args = ["/c", "start", "", "irisnotes", `--open-note=${noteId}`];
	} else {
		console.error(chalk.red(`Unsupported platform: ${os}`));
		process.exit(1);
	}

	const child = spawn(command, args, {
		detached: true,
		stdio: "ignore",
	});
	child.unref();
}

// ============================================================================
// OPEN COMMAND
// ============================================================================
program
	.command("open <id-or-title>")
	.alias("o")
	.description("Open a note in IrisNotes (by ID or title)")
	.option("-n, --number <n>", "Select match number directly (for scripting)")
	.action(async (idOrTitle, options) => {
		try {
			// Try to find by ID first
			let note: NoteItem | undefined = getItemById(idOrTitle);

			// If not found by full ID, try partial ID match
			if (!note) {
				const allNotes = getAllNotes();
				note = allNotes.find((n) => n.id.startsWith(idOrTitle));
			}

			// If still not found, try by title
			let matches: NoteItem[] = [];
			if (!note) {
				matches = findNotesByTitle(idOrTitle);
				if (matches.length === 1) {
					note = matches[0];
				} else if (matches.length > 1) {
					// Multiple matches - handle selection
					if (options.number) {
						// Direct selection via --number flag
						const idx = parseInt(options.number) - 1;
						if (idx >= 0 && idx < matches.length) {
							note = matches[idx];
						} else {
							console.error(chalk.red(`Invalid selection: ${options.number}. Valid range: 1-${matches.length}`));
							process.exit(1);
						}
					} else {
						// Interactive selection
						console.log(chalk.yellow(`\nMultiple notes found matching "${idOrTitle}":\n`));
						
						for (let i = 0; i < matches.length; i++) {
							const m = matches[i];
							if (!m) continue;
							const path = getItemPath(m);
							const date = new Date(m.updated_at).toLocaleDateString();
							console.log(`  ${chalk.cyan(`[${i + 1}]`)} ${path} ${chalk.gray(`(${date})`)}`);
						}
						
						console.log();
						const prompt = "Enter number to open (or 0 to cancel): ";
						process.stdout.write(prompt);
						
						// Read single line from stdin
						for await (const line of console) {
							const choice = parseInt(line.trim());
							if (choice === 0) {
								console.log(chalk.gray("Cancelled."));
								process.exit(0);
							}
							if (choice >= 1 && choice <= matches.length) {
								note = matches[choice - 1];
								break;
							}
							console.error(chalk.red(`Invalid choice. Enter 1-${matches.length} or 0 to cancel.`));
							process.stdout.write(prompt);
						}
					}
				}
			}

			if (!note) {
				console.error(chalk.red(`Note not found: "${idOrTitle}"`));
				console.log(chalk.gray("\nTip: Use `iris search` to find notes, or `iris list -i` to see IDs"));
				process.exit(1);
			}

			console.log(chalk.green(`Opening: ${note.title}`));
			console.log(chalk.gray(`ID: ${note.id}`));

			launchIrisNotes(note.id);
		} catch (error) {
			console.error(chalk.red("Error:"), (error as Error).message);
			process.exit(1);
		} finally {
			closeDatabase();
		}
	});

// ============================================================================
// SHOW COMMAND (cat alias)
// ============================================================================
program
	.command("show <id-or-title>")
	.alias("cat")
	.description("Display note content")
	.option("-p, --plain", "Strip HTML tags (plaintext)")
	.option("-j, --json", "Output as JSON")
	.option("-n, --number <n>", "Select match number directly (for scripting)")
	.action((idOrTitle, options) => {
		try {
			// Try to find by ID first
			let note: NoteItem | undefined = getItemById(idOrTitle);

			// Try partial ID match
			if (!note) {
				const allNotes = getAllNotes();
				note = allNotes.find((n) => n.id.startsWith(idOrTitle));
			}

			// Try by title
			if (!note) {
				const matches = findNotesByTitle(idOrTitle);
				if (matches.length === 1) {
					note = matches[0];
				} else if (matches.length > 1) {
					if (options.number) {
						const idx = parseInt(options.number) - 1;
						if (idx >= 0 && idx < matches.length) {
							note = matches[idx];
						}
					} else {
						console.error(chalk.yellow(`Multiple notes found matching "${idOrTitle}":`));
						for (let i = 0; i < matches.length; i++) {
							const m = matches[i];
							if (!m) continue;
							console.log(`  [${i + 1}] ${getItemPath(m)}`);
						}
						console.log(chalk.gray("\nUse --number <n> to select, or use ID directly."));
						process.exit(1);
					}
				}
			}

			if (!note) {
				console.error(chalk.red(`Note not found: "${idOrTitle}"`));
				process.exit(1);
			}

			if (options.json) {
				console.log(JSON.stringify(note, null, 2));
				return;
			}

			let content = note.content || "";

			if (options.plain) {
				// Simple HTML tag stripping
				content = content
					.replace(/<[^>]+>/g, "")
					.replace(/&nbsp;/g, " ")
					.replace(/&lt;/g, "<")
					.replace(/&gt;/g, ">")
					.replace(/&amp;/g, "&")
					.replace(/&quot;/g, '"')
					.trim();
			}

			console.log(chalk.bold(`\n📄 ${note.title}\n`));
			console.log(chalk.gray(`Path: ${getItemPath(note)}`));
			console.log(chalk.gray(`Updated: ${new Date(note.updated_at).toLocaleString()}`));
			console.log(chalk.gray("─".repeat(50)));
			console.log(content);
			console.log();
		} catch (error) {
			console.error(chalk.red("Error:"), (error as Error).message);
			process.exit(1);
		} finally {
			closeDatabase();
		}
	});

// ============================================================================
// TREE COMMAND
// ============================================================================
program
	.command("tree")
	.description("Display hierarchical tree of all items")
	.option("-d, --depth <n>", "Maximum depth to display", "10")
	.action((options) => {
		try {
			const allItems = getAllItems();
			const maxDepth = parseInt(options.depth);

			// Build tree structure
			const itemMap = new Map<string, NoteItem>();
			const childrenMap = new Map<string, NoteItem[]>();

			for (const item of allItems) {
				itemMap.set(item.id, item);
				const parentId = item.parent_id || "root";
				if (!childrenMap.has(parentId)) {
					childrenMap.set(parentId, []);
				}
				childrenMap.get(parentId)!.push(item);
			}

			// Print tree recursively
			function printTree(parentId: string, prefix: string, depth: number) {
				if (depth > maxDepth) return;

				const children = childrenMap.get(parentId) || [];
				for (let i = 0; i < children.length; i++) {
					const child = children[i];
					if (!child) continue;
					
					const isLast = i === children.length - 1;
					const connector = isLast ? "└─" : "├─";
					const icon = child.type === "book" ? "📚" : child.type === "section" ? "📁" : "📄";

					console.log(`${prefix}${connector} ${icon} ${child.title}`);

					const newPrefix = prefix + (isLast ? "   " : "│  ");
					printTree(child.id, newPrefix, depth + 1);
				}
			}

			console.log(chalk.bold("\n📓 IrisNotes\n"));
			printTree("root", "", 0);
			console.log();
		} catch (error) {
			console.error(chalk.red("Error:"), (error as Error).message);
			process.exit(1);
		} finally {
			closeDatabase();
		}
	});

// ============================================================================
// ID COMMAND - Quick way to get note ID
// ============================================================================
program
	.command("id <title>")
	.description("Get the ID of a note by its title")
	.option("-a, --all", "Show all matching IDs")
	.action((title, options) => {
		try {
			const matches = findNotesByTitle(title);

			if (matches.length === 0) {
				console.error(chalk.red(`Note not found: "${title}"`));
				process.exit(1);
			}

			if (options.all || matches.length > 1) {
				// Show all matches with their paths
				for (const m of matches) {
					console.log(`${m.id}\t${getItemPath(m)}`);
				}
			} else {
				// Single match - just output ID (useful for scripting)
				console.log(matches[0]?.id);
			}
		} catch (error) {
			console.error(chalk.red("Error:"), (error as Error).message);
			process.exit(1);
		} finally {
			closeDatabase();
		}
	});

program.parse();
