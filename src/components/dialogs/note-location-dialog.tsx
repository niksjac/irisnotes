import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type FC } from "react";
import { X, FileText, Book, FolderOpen, Plus } from "lucide-react";
import { useNoteActions } from "@/hooks";

interface NoteLocationDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onCreateNote: (parentId: string | null, newBookTitle?: string) => void;
}

export const NoteLocationDialog: FC<NoteLocationDialogProps> = ({
	isOpen,
	onClose,
	onCreateNote,
}) => {
	const dialogRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const { getBooks, getSectionsForBook } = useNoteActions();
	const [books, setBooks] = useState<Array<{ id: string; title: string }>>([]);
	const [sections, setSections] = useState<
		Array<{ id: string; title: string }>
	>([]);
	const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
	const [isCreatingNewBook, setIsCreatingNewBook] = useState(false);
	const [newBookTitle, setNewBookTitle] = useState("");

	// Load books when dialog opens
	useEffect(() => {
		if (isOpen) {
			setBooks(getBooks());
			setSelectedBookId(null);
			setSections([]);
			setIsCreatingNewBook(false);
			setNewBookTitle("");
		}
	}, [isOpen, getBooks]);

	// Load sections when a book is selected
	useEffect(() => {
		if (selectedBookId) {
			setSections(getSectionsForBook(selectedBookId));
		} else {
			setSections([]);
		}
	}, [selectedBookId, getSectionsForBook]);

	// Focus input when creating new book
	useEffect(() => {
		if (isCreatingNewBook && inputRef.current) {
			inputRef.current.focus();
		}
	}, [isCreatingNewBook]);

	// Handle escape key
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	// Handle click outside to close
	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (e: MouseEvent) => {
			if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
				onClose();
			}
		};

		// Delay to prevent immediate close
		const timeoutId = setTimeout(() => {
			document.addEventListener("mousedown", handleClickOutside);
		}, 0);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen, onClose]);

	const handleCreateInRoot = () => {
		onCreateNote(null);
		onClose();
	};

	const handleCreateInBook = (bookId: string) => {
		onCreateNote(bookId);
		onClose();
	};

	const handleCreateInSection = (sectionId: string) => {
		onCreateNote(sectionId);
		onClose();
	};

	const handleCreateNewBook = () => {
		if (newBookTitle.trim()) {
			onCreateNote(null, newBookTitle.trim());
			onClose();
		}
	};

	const handleNewBookKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleCreateNewBook();
		}
	};

	if (!isOpen) return null;

	const dialogContent = (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div
				ref={dialogRef}
				className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
			>
				{/* Header */}
				<div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
						Create Note In...
					</h2>
					<button
						onClick={onClose}
						className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-4 max-h-96 overflow-y-auto">
					{/* Root option */}
					<button
						onClick={handleCreateInRoot}
						className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						<FileText className="h-5 w-5 text-blue-500" />
						<span className="text-gray-900 dark:text-gray-100">
							Root (no parent)
						</span>
					</button>

					{/* Divider */}
					<div className="h-px bg-gray-200 dark:bg-gray-700 my-3" />

					{/* Books section */}
					<div className="mb-2">
						<span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
							Books
						</span>
					</div>

					{books.length === 0 && !isCreatingNewBook ? (
						<p className="text-sm text-gray-500 dark:text-gray-400 px-3 py-2">
							No books yet.
						</p>
					) : (
						<div className="space-y-1">
							{books.map((book) => (
								<div key={book.id}>
									<button
										onClick={() => {
											if (selectedBookId === book.id) {
												// If already selected, create note in book
												handleCreateInBook(book.id);
											} else {
												// Otherwise select to show sections
												setSelectedBookId(book.id);
											}
										}}
										className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-md transition-colors ${
											selectedBookId === book.id
												? "bg-blue-50 dark:bg-blue-900/30"
												: "hover:bg-gray-100 dark:hover:bg-gray-700"
										}`}
									>
										<Book className="h-5 w-5 text-amber-500" />
										<span className="text-gray-900 dark:text-gray-100 flex-1">
											{book.title}
										</span>
										{selectedBookId === book.id && (
											<span className="text-xs text-blue-500">
												Click again to select
											</span>
										)}
									</button>

									{/* Show sections if book is selected */}
									{selectedBookId === book.id && sections.length > 0 && (
										<div className="ml-6 mt-1 space-y-1">
											{sections.map((section) => (
												<button
													key={section.id}
													onClick={() => handleCreateInSection(section.id)}
													className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
												>
													<FolderOpen className="h-4 w-4 text-purple-500" />
													<span className="text-sm text-gray-900 dark:text-gray-100">
														{section.title}
													</span>
												</button>
											))}
										</div>
									)}
								</div>
							))}
						</div>
					)}

					{/* Create new book option */}
					<div className="mt-3">
						{isCreatingNewBook ? (
							<div className="flex items-center gap-2">
								<input
									ref={inputRef}
									type="text"
									value={newBookTitle}
									onChange={(e) => setNewBookTitle(e.target.value)}
									onKeyDown={handleNewBookKeyDown}
									placeholder="Enter book name..."
									className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<button
									onClick={handleCreateNewBook}
									disabled={!newBookTitle.trim()}
									className="px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									Create
								</button>
								<button
									onClick={() => {
										setIsCreatingNewBook(false);
										setNewBookTitle("");
									}}
									className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
								>
									Cancel
								</button>
							</div>
						) : (
							<button
								onClick={() => setIsCreatingNewBook(true)}
								className="w-full flex items-center gap-3 px-3 py-2 text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-blue-500"
							>
								<Plus className="h-5 w-5" />
								<span>Create new book...</span>
							</button>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
					Press Escape to cancel
				</div>
			</div>
		</div>
	);

	return createPortal(dialogContent, document.body);
};
