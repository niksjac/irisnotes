/**
 * Export/Import Service for IrisNotes
 * 
 * Provides file-based backup and restore functionality:
 * - Export: Database → Folder structure with markdown files
 * - Import: Folder structure → Database items
 * 
 * Directory Structure:
 * ```
 * export/
 * ├── Book Name/
 * │   ├── Section Name/
 * │   │   ├── note-title.md
 * │   │   └── another-note.md
 * │   └── direct-book-note.md
 * ├── Another Book/
 * │   └── note.md
 * └── _root/
 *     └── standalone-note.md
 * ```
 * 
 * Note Format (Markdown with YAML frontmatter):
 * ```markdown
 * ---
 * id: note_123456
 * title: My Note Title
 * created: 2024-01-15T10:30:00Z
 * updated: 2024-01-16T14:20:00Z
 * content_type: html
 * ---
 * 
 * <p>Note content in HTML...</p>
 * ```
 */

import {
	exists,
	mkdir,
	readDir,
	readTextFile,
	writeTextFile,
} from "@tauri-apps/plugin-fs";
import { join } from "@tauri-apps/api/path";
import type { FlexibleItem } from "@/types/items";
import type { StorageAdapter } from "./types";

// ============================================================================
// TYPES
// ============================================================================

export interface ExportOptions {
	/** Target directory for export */
	targetDir: string;
	/** Include deleted items (soft-deleted) */
	includeDeleted?: boolean;
	/** Export format for content */
	contentFormat?: "html" | "markdown" | "plaintext";
}

export interface ImportOptions {
	/** Source directory to import from */
	sourceDir: string;
	/** How to handle conflicts with existing items */
	conflictStrategy?: "skip" | "overwrite" | "rename";
	/** Import only specific types */
	types?: Array<"note" | "book" | "section">;
}

export interface ExportResult {
	success: boolean;
	exportedCount: number;
	errors: string[];
	path: string;
}

export interface ImportResult {
	success: boolean;
	importedCount: number;
	skippedCount: number;
	errors: string[];
}

interface NoteFrontmatter {
	id?: string;
	title: string;
	created?: string;
	updated?: string;
	content_type?: string;
	metadata?: Record<string, unknown>;
}

// ============================================================================
// EXPORT
// ============================================================================

/**
 * Export all items to a folder structure
 */
export async function exportToFolder(
	adapter: StorageAdapter,
	options: ExportOptions
): Promise<ExportResult> {
	const errors: string[] = [];
	let exportedCount = 0;

	try {
		// Get all items from database
		const itemsResult = await adapter.getAllItems();
		if (!itemsResult.success) {
			return {
				success: false,
				exportedCount: 0,
				errors: [itemsResult.error],
				path: options.targetDir,
			};
		}

		const items = itemsResult.data.filter(
			(item) => options.includeDeleted || !item.deleted_at
		);

		// Build lookup maps
		const itemsById = new Map(items.map((item) => [item.id, item]));

		// Create target directory
		if (!(await exists(options.targetDir))) {
			await mkdir(options.targetDir, { recursive: true });
		}

		// Process each item
		for (const item of items) {
			try {
				if (item.type === "book") {
					// Create book folder
					const bookPath = await join(options.targetDir, sanitizeFilename(item.title));
					if (!(await exists(bookPath))) {
						await mkdir(bookPath, { recursive: true });
					}
					exportedCount++;
				} else if (item.type === "section") {
					// Create section folder inside parent book
					const parent = item.parent_id ? itemsById.get(item.parent_id) : null;
					if (parent?.type === "book") {
						const sectionPath = await join(
							options.targetDir,
							sanitizeFilename(parent.title),
							sanitizeFilename(item.title)
						);
						if (!(await exists(sectionPath))) {
							await mkdir(sectionPath, { recursive: true });
						}
						exportedCount++;
					}
				} else if (item.type === "note") {
					// Determine the folder path based on hierarchy
					const notePath = await getNoteExportPath(
						options.targetDir,
						item,
						itemsById
					);
					
					// Write note file
					const noteContent = formatNoteForExport(item, options.contentFormat);
					await writeTextFile(notePath, noteContent);
					exportedCount++;
				}
			} catch (itemError) {
				errors.push(`Failed to export ${item.type} "${item.title}": ${itemError}`);
			}
		}

		return {
			success: errors.length === 0,
			exportedCount,
			errors,
			path: options.targetDir,
		};
	} catch (error) {
		return {
			success: false,
			exportedCount,
			errors: [...errors, `Export failed: ${error}`],
			path: options.targetDir,
		};
	}
}

/**
 * Get the file path for exporting a note
 */
async function getNoteExportPath(
	baseDir: string,
	note: FlexibleItem,
	itemsById: Map<string, FlexibleItem>
): Promise<string> {
	const filename = sanitizeFilename(note.title) + ".md";

	if (!note.parent_id) {
		// Root-level note
		const rootDir = await join(baseDir, "_root");
		if (!(await exists(rootDir))) {
			await mkdir(rootDir, { recursive: true });
		}
		return join(rootDir, filename);
	}

	const parent = itemsById.get(note.parent_id);
	if (!parent) {
		// Orphan note - put in root
		const rootDir = await join(baseDir, "_root");
		if (!(await exists(rootDir))) {
			await mkdir(rootDir, { recursive: true });
		}
		return join(rootDir, filename);
	}

	if (parent.type === "book") {
		// Note directly under a book
		return join(baseDir, sanitizeFilename(parent.title), filename);
	}

	if (parent.type === "section") {
		// Note under a section - find the book
		const book = parent.parent_id ? itemsById.get(parent.parent_id) : null;
		if (book?.type === "book") {
			return join(
				baseDir,
				sanitizeFilename(book.title),
				sanitizeFilename(parent.title),
				filename
			);
		}
	}

	// Fallback to root
	const rootDir = await join(baseDir, "_root");
	if (!(await exists(rootDir))) {
		await mkdir(rootDir, { recursive: true });
	}
	return join(rootDir, filename);
}

/**
 * Format a note for export with YAML frontmatter
 */
function formatNoteForExport(
	note: FlexibleItem,
	format: "html" | "markdown" | "plaintext" = "html"
): string {
	const frontmatter: NoteFrontmatter = {
		id: note.id,
		title: note.title,
		created: note.created_at,
		updated: note.updated_at,
		content_type: note.content_type,
	};

	// Add non-empty metadata
	if (note.metadata && Object.keys(note.metadata).length > 0) {
		// Filter out internal metadata
		const cleanMetadata = Object.fromEntries(
			Object.entries(note.metadata).filter(([key]) => !key.startsWith("_"))
		);
		if (Object.keys(cleanMetadata).length > 0) {
			frontmatter.metadata = cleanMetadata;
		}
	}

	const yaml = Object.entries(frontmatter)
		.filter(([, value]) => value !== undefined && value !== null)
		.map(([key, value]) => {
			if (typeof value === "object") {
				return `${key}: ${JSON.stringify(value)}`;
			}
			return `${key}: ${value}`;
		})
		.join("\n");

	let content = note.content || "";

	// Convert content format if needed
	if (format === "plaintext") {
		content = note.content_plaintext || stripHtml(content);
	} else if (format === "markdown" && note.content_type === "html") {
		// Basic HTML to markdown - could be enhanced
		content = htmlToBasicMarkdown(content);
	}

	return `---\n${yaml}\n---\n\n${content}`;
}

// ============================================================================
// IMPORT
// ============================================================================

/**
 * Import items from a folder structure
 */
export async function importFromFolder(
	adapter: StorageAdapter,
	options: ImportOptions
): Promise<ImportResult> {
	const errors: string[] = [];
	let importedCount = 0;
	let skippedCount = 0;

	try {
		// Verify source directory exists
		if (!(await exists(options.sourceDir))) {
			return {
				success: false,
				importedCount: 0,
				skippedCount: 0,
				errors: [`Source directory does not exist: ${options.sourceDir}`],
			};
		}

		// Get existing items for conflict detection
		const existingResult = await adapter.getAllItems();
		const existingIds = new Set(
			existingResult.success ? existingResult.data.map((i) => i.id) : []
		);

		// Read top-level directory
		const entries = await readDir(options.sourceDir);

		for (const entry of entries) {
			if (!entry.isDirectory) continue;

			const folderName = entry.name;

			if (folderName === "_root") {
				// Root-level notes
				const result = await importNotesFromFolder(
					adapter,
					await join(options.sourceDir, folderName),
					null, // No parent
					existingIds,
					options.conflictStrategy || "skip"
				);
				importedCount += result.imported;
				skippedCount += result.skipped;
				errors.push(...result.errors);
			} else {
				// This is a book folder
				const bookResult = await importBookFolder(
					adapter,
					await join(options.sourceDir, folderName),
					folderName,
					existingIds,
					options.conflictStrategy || "skip"
				);
				importedCount += bookResult.imported;
				skippedCount += bookResult.skipped;
				errors.push(...bookResult.errors);
			}
		}

		return {
			success: errors.length === 0,
			importedCount,
			skippedCount,
			errors,
		};
	} catch (error) {
		return {
			success: false,
			importedCount,
			skippedCount,
			errors: [...errors, `Import failed: ${error}`],
		};
	}
}

/**
 * Import a book folder and its contents
 */
async function importBookFolder(
	adapter: StorageAdapter,
	bookPath: string,
	bookTitle: string,
	existingIds: Set<string>,
	conflictStrategy: "skip" | "overwrite" | "rename"
): Promise<{ imported: number; skipped: number; errors: string[] }> {
	const errors: string[] = [];
	let imported = 0;
	let skipped = 0;

	try {
		// Create the book
		const bookResult = await adapter.createItem({
			type: "book",
			title: bookTitle,
		});

		if (!bookResult.success) {
			errors.push(`Failed to create book "${bookTitle}": ${bookResult.error}`);
			return { imported, skipped, errors };
		}

		const bookId = bookResult.data.id;
		imported++;

		// Read book folder contents
		const entries = await readDir(bookPath);

		for (const entry of entries) {
			const entryPath = await join(bookPath, entry.name);

			if (entry.isDirectory) {
				// This is a section
				const sectionResult = await importSectionFolder(
					adapter,
					entryPath,
					entry.name,
					bookId,
					existingIds,
					conflictStrategy
				);
				imported += sectionResult.imported;
				skipped += sectionResult.skipped;
				errors.push(...sectionResult.errors);
			} else if (entry.name.endsWith(".md")) {
				// Direct note in book
				const noteResult = await importNoteFile(
					adapter,
					entryPath,
					bookId,
					existingIds,
					conflictStrategy
				);
				if (noteResult.imported) imported++;
				if (noteResult.skipped) skipped++;
				if (noteResult.error) errors.push(noteResult.error);
			}
		}
	} catch (error) {
		errors.push(`Failed to import book "${bookTitle}": ${error}`);
	}

	return { imported, skipped, errors };
}

/**
 * Import a section folder and its notes
 */
async function importSectionFolder(
	adapter: StorageAdapter,
	sectionPath: string,
	sectionTitle: string,
	bookId: string,
	existingIds: Set<string>,
	conflictStrategy: "skip" | "overwrite" | "rename"
): Promise<{ imported: number; skipped: number; errors: string[] }> {
	const errors: string[] = [];
	let imported = 0;
	let skipped = 0;

	try {
		// Create the section
		const sectionResult = await adapter.createItem({
			type: "section",
			title: sectionTitle,
			parent_id: bookId,
		});

		if (!sectionResult.success) {
			errors.push(
				`Failed to create section "${sectionTitle}": ${sectionResult.error}`
			);
			return { imported, skipped, errors };
		}

		const sectionId = sectionResult.data.id;
		imported++;

		// Import notes from section
		const notesResult = await importNotesFromFolder(
			adapter,
			sectionPath,
			sectionId,
			existingIds,
			conflictStrategy
		);
		imported += notesResult.imported;
		skipped += notesResult.skipped;
		errors.push(...notesResult.errors);
	} catch (error) {
		errors.push(`Failed to import section "${sectionTitle}": ${error}`);
	}

	return { imported, skipped, errors };
}

/**
 * Import all markdown files from a folder as notes
 */
async function importNotesFromFolder(
	adapter: StorageAdapter,
	folderPath: string,
	parentId: string | null,
	existingIds: Set<string>,
	conflictStrategy: "skip" | "overwrite" | "rename"
): Promise<{ imported: number; skipped: number; errors: string[] }> {
	const errors: string[] = [];
	let imported = 0;
	let skipped = 0;

	try {
		const entries = await readDir(folderPath);

		for (const entry of entries) {
			if (!entry.isDirectory && entry.name.endsWith(".md")) {
				const notePath = await join(folderPath, entry.name);
				const result = await importNoteFile(
					adapter,
					notePath,
					parentId,
					existingIds,
					conflictStrategy
				);
				if (result.imported) imported++;
				if (result.skipped) skipped++;
				if (result.error) errors.push(result.error);
			}
		}
	} catch (error) {
		errors.push(`Failed to read folder "${folderPath}": ${error}`);
	}

	return { imported, skipped, errors };
}

/**
 * Import a single markdown file as a note
 */
async function importNoteFile(
	adapter: StorageAdapter,
	filePath: string,
	parentId: string | null,
	existingIds: Set<string>,
	conflictStrategy: "skip" | "overwrite" | "rename"
): Promise<{ imported: boolean; skipped: boolean; error?: string }> {
	try {
		const content = await readTextFile(filePath);
		const parsed = parseNoteFrontmatter(content);

		// Check for conflicts
		if (parsed.id && existingIds.has(parsed.id)) {
			if (conflictStrategy === "skip") {
				return { imported: false, skipped: true };
			} else if (conflictStrategy === "rename") {
				// Clear the ID to create a new note
				parsed.id = undefined;
			}
			// For "overwrite", we'd need to update - for now, skip
			return { imported: false, skipped: true };
		}

		// Create the note
		const result = await adapter.createItem({
			type: "note",
			title: parsed.title,
			content: parsed.content,
			content_type: (parsed.content_type as "html" | "markdown" | "plain") || "html",
			parent_id: parentId || undefined,
			metadata: parsed.metadata,
		});

		if (!result.success) {
			return {
				imported: false,
				skipped: false,
				error: `Failed to import note "${parsed.title}": ${result.error}`,
			};
		}

		return { imported: true, skipped: false };
	} catch (error) {
		return {
			imported: false,
			skipped: false,
			error: `Failed to read note file "${filePath}": ${error}`,
		};
	}
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Parse YAML frontmatter from a markdown file
 */
function parseNoteFrontmatter(content: string): {
	id?: string;
	title: string;
	content: string;
	content_type?: string;
	metadata?: Record<string, unknown>;
} {
	const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n\n?([\s\S]*)$/);

	if (!frontmatterMatch) {
		// No frontmatter - use filename-based title
		return {
			title: "Imported Note",
			content: content,
		};
	}

	const [, yamlContent, bodyContent] = frontmatterMatch;
	const result: ReturnType<typeof parseNoteFrontmatter> = {
		title: "Imported Note",
		content: bodyContent || "",
	};

	if (!yamlContent) {
		return result;
	}

	// Simple YAML parsing
	const lines = yamlContent.split("\n");
	for (const line of lines) {
		const match = line.match(/^(\w+):\s*(.*)$/);
		if (match) {
			const key = match[1];
			const value = match[2] || "";
			switch (key) {
				case "id":
					result.id = value;
					break;
				case "title":
					result.title = value || "Imported Note";
					break;
				case "content_type":
					result.content_type = value;
					break;
				case "metadata":
					try {
						result.metadata = JSON.parse(value);
					} catch {
						// Ignore parse errors
					}
					break;
			}
		}
	}

	return result;
}

/**
 * Sanitize a string for use as a filename
 */
function sanitizeFilename(name: string): string {
	return name
		.replace(/[<>:"/\\|?*]/g, "_") // Replace invalid chars
		.replace(/\s+/g, " ") // Normalize spaces
		.trim()
		.slice(0, 100); // Limit length
}

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
	return html
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.trim();
}

/**
 * Basic HTML to Markdown conversion
 */
function htmlToBasicMarkdown(html: string): string {
	return html
		.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
		.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
		.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
		.replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n")
		.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
		.replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
		.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
		.replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
		.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
		.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
		.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
		.replace(/<ul[^>]*>|<\/ul>/gi, "\n")
		.replace(/<ol[^>]*>|<\/ol>/gi, "\n")
		.replace(/<[^>]+>/g, "") // Remove remaining tags
		.replace(/\n{3,}/g, "\n\n") // Normalize newlines
		.trim();
}
