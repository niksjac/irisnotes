import { createPortal } from "react-dom";
import {
	useEffect,
	useRef,
	useState,
	useMemo,
	type FC,
	type KeyboardEvent,
} from "react";
import { X, Book, FolderOpen } from "lucide-react";
import { useNoteActions } from "@/hooks";

interface NoteLocationDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onCreateNote: (
		noteTitle: string,
		bookInfo: { id: string } | { title: string } | null,
		sectionInfo: { id: string } | { title: string } | null
	) => void;
}

interface ComboboxItem {
	id: string;
	title: string;
}

export const NoteLocationDialog: FC<NoteLocationDialogProps> = ({
	isOpen,
	onClose,
	onCreateNote,
}) => {
	const dialogRef = useRef<HTMLDivElement>(null);
	const noteInputRef = useRef<HTMLInputElement>(null);
	const { getBooks, getSectionsForBook, items } = useNoteActions();

	// Form state
	const [noteTitle, setNoteTitle] = useState("");
	const [bookQuery, setBookQuery] = useState("");
	const [sectionQuery, setSectionQuery] = useState("");

	// Dropdown visibility
	const [showBookDropdown, setShowBookDropdown] = useState(false);
	const [showSectionDropdown, setShowSectionDropdown] = useState(false);

	// Selected items (from dropdown)
	const [selectedBook, setSelectedBook] = useState<ComboboxItem | null>(null);
	const [selectedSection, setSelectedSection] = useState<ComboboxItem | null>(
		null
	);

	// Dropdown highlight index
	const [bookHighlightIndex, setBookHighlightIndex] = useState(0);
	const [sectionHighlightIndex, setSectionHighlightIndex] = useState(0);

	// Get all books
	const allBooks = useMemo(() => getBooks(), [getBooks]);

	// Get all sections (for when no book is selected)
	const allSections = useMemo(() => {
		return items.filter(
			(item) => item.type === "section" && !item.deleted_at
		);
	}, [items]);

	// Filter books based on query
	const filteredBooks = useMemo(() => {
		if (!bookQuery.trim()) return allBooks;
		const query = bookQuery.toLowerCase();
		return allBooks.filter((book) => book.title.toLowerCase().includes(query));
	}, [allBooks, bookQuery]);

	// Filter sections based on query and selected book
	const filteredSections = useMemo(() => {
		// If a book is selected, only show sections from that book
		const sectionsToFilter = selectedBook
			? getSectionsForBook(selectedBook.id)
			: allSections;

		if (!sectionQuery.trim()) return sectionsToFilter;
		const query = sectionQuery.toLowerCase();
		return sectionsToFilter.filter((section) =>
			section.title.toLowerCase().includes(query)
		);
	}, [selectedBook, allSections, getSectionsForBook, sectionQuery]);

	// Check if current query exactly matches an existing item
	const bookExactMatch = useMemo(() => {
		const query = bookQuery.trim().toLowerCase();
		return query
			? allBooks.find((b) => b.title.toLowerCase() === query)
			: null;
	}, [allBooks, bookQuery]);

	const sectionExactMatch = useMemo(() => {
		const query = sectionQuery.trim().toLowerCase();
		const sectionsToSearch = selectedBook
			? getSectionsForBook(selectedBook.id)
			: allSections;
		return query
			? sectionsToSearch.find((s) => s.title.toLowerCase() === query)
			: null;
	}, [allSections, selectedBook, getSectionsForBook, sectionQuery]);

	// Reset state when dialog opens
	useEffect(() => {
		if (isOpen) {
			setNoteTitle("");
			setBookQuery("");
			setSectionQuery("");
			setSelectedBook(null);
			setSelectedSection(null);
			setShowBookDropdown(false);
			setShowSectionDropdown(false);
			setBookHighlightIndex(0);
			setSectionHighlightIndex(0);
			// Focus note input after render
			setTimeout(() => noteInputRef.current?.focus(), 0);
		}
	}, [isOpen]);

	// Reset section when book changes
	useEffect(() => {
		setSectionQuery("");
		setSelectedSection(null);
	}, [selectedBook]);

	// Reset highlight when filtered results change
	useEffect(() => {
		setBookHighlightIndex(0);
	}, [filteredBooks]);

	useEffect(() => {
		setSectionHighlightIndex(0);
	}, [filteredSections]);

	// Handle escape key
	useEffect(() => {
		if (!isOpen) return;

		const handleKeyDown = (e: globalThis.KeyboardEvent) => {
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

		const timeoutId = setTimeout(() => {
			document.addEventListener("mousedown", handleClickOutside);
		}, 0);

		return () => {
			clearTimeout(timeoutId);
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen, onClose]);

	const handleSubmit = () => {
		const title = noteTitle.trim();
		if (!title) return;

		// Determine book info
		let bookInfo: { id: string } | { title: string } | null = null;
		if (selectedBook) {
			bookInfo = { id: selectedBook.id };
		} else if (bookQuery.trim()) {
			// Check if it matches an existing book
			if (bookExactMatch) {
				bookInfo = { id: bookExactMatch.id };
			} else {
				bookInfo = { title: bookQuery.trim() };
			}
		}

		// Determine section info
		let sectionInfo: { id: string } | { title: string } | null = null;
		if (selectedSection) {
			sectionInfo = { id: selectedSection.id };
		} else if (sectionQuery.trim()) {
			// Check if it matches an existing section
			if (sectionExactMatch) {
				sectionInfo = { id: sectionExactMatch.id };
			} else {
				sectionInfo = { title: sectionQuery.trim() };
			}
		}

		onCreateNote(title, bookInfo, sectionInfo);
		onClose();
	};

	const handleNoteKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && noteTitle.trim()) {
			e.preventDefault();
			handleSubmit();
		}
	};

	const handleBookKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setShowBookDropdown(true);
			setBookHighlightIndex((prev) =>
				Math.min(prev + 1, filteredBooks.length - 1)
			);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setBookHighlightIndex((prev) => Math.max(prev - 1, 0));
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (showBookDropdown && filteredBooks[bookHighlightIndex]) {
				selectBook(filteredBooks[bookHighlightIndex]);
			}
		} else if (e.key === "Escape") {
			setShowBookDropdown(false);
		}
	};

	const handleSectionKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setShowSectionDropdown(true);
			setSectionHighlightIndex((prev) =>
				Math.min(prev + 1, filteredSections.length - 1)
			);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setSectionHighlightIndex((prev) => Math.max(prev - 1, 0));
		} else if (e.key === "Enter") {
			e.preventDefault();
			if (showSectionDropdown && filteredSections[sectionHighlightIndex]) {
				selectSection(filteredSections[sectionHighlightIndex]);
			}
		} else if (e.key === "Escape") {
			setShowSectionDropdown(false);
		}
	};

	const selectBook = (book: ComboboxItem) => {
		setSelectedBook(book);
		setBookQuery(book.title);
		setShowBookDropdown(false);
	};

	const selectSection = (section: ComboboxItem) => {
		setSelectedSection(section);
		setSectionQuery(section.title);
		setShowSectionDropdown(false);
	};

	const getBookHelper = () => {
		if (selectedBook) {
			return (
				<span className="text-green-600 dark:text-green-400">
					Using existing book
				</span>
			);
		}
		if (bookQuery.trim()) {
			if (bookExactMatch) {
				return (
					<span className="text-green-600 dark:text-green-400">
						Matches existing book
					</span>
				);
			}
			return (
				<span className="text-blue-600 dark:text-blue-400">
					Will create new book
				</span>
			);
		}
		return (
			<span className="text-gray-400 dark:text-gray-500">
				Leave empty for root
			</span>
		);
	};

	const getSectionHelper = () => {
		if (!bookQuery.trim() && !selectedBook) {
			return (
				<span className="text-gray-400 dark:text-gray-500">
					Select a book first
				</span>
			);
		}
		if (selectedSection) {
			return (
				<span className="text-green-600 dark:text-green-400">
					Using existing section
				</span>
			);
		}
		if (sectionQuery.trim()) {
			if (sectionExactMatch) {
				return (
					<span className="text-green-600 dark:text-green-400">
						Matches existing section
					</span>
				);
			}
			return (
				<span className="text-blue-600 dark:text-blue-400">
					Will create new section
				</span>
			);
		}
		return (
			<span className="text-gray-400 dark:text-gray-500">
				Leave empty for book root
			</span>
		);
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
						Create New Note
					</h2>
					<button
						onClick={onClose}
						className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-4 space-y-4">
					{/* Note Title Field */}
					<div>
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							Note Title <span className="text-red-500">*</span>
						</label>
						<input
							ref={noteInputRef}
							type="text"
							value={noteTitle}
							onChange={(e) => setNoteTitle(e.target.value)}
							onKeyDown={handleNoteKeyDown}
							placeholder="Enter note title..."
							className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
							autoComplete="off"
						/>
						<p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
							Press Enter to create note
						</p>
					</div>

					{/* Book Field */}
					<div className="relative">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							<Book className="inline h-4 w-4 mr-1 text-amber-500" />
							Book
						</label>
						<input
							type="text"
							value={bookQuery}
							onChange={(e) => {
								setBookQuery(e.target.value);
								setSelectedBook(null);
								setShowBookDropdown(true);
							}}
							onFocus={() => setShowBookDropdown(true)}
							onBlur={() => setTimeout(() => setShowBookDropdown(false), 150)}
							onKeyDown={handleBookKeyDown}
							placeholder="Type to search or create..."
							className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
							autoComplete="off"
						/>
						<p className="mt-1 text-xs">{getBookHelper()}</p>

						{/* Book Dropdown */}
						{showBookDropdown && filteredBooks.length > 0 && (
							<div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
								{filteredBooks.map((book, index) => (
									<button
										key={book.id}
										onMouseDown={() => selectBook(book)}
										className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
											index === bookHighlightIndex
												? "bg-blue-50 dark:bg-blue-900/30"
												: "hover:bg-gray-100 dark:hover:bg-gray-600"
										}`}
									>
										<Book className="h-4 w-4 text-amber-500" />
										<span className="text-gray-900 dark:text-gray-100">
											{book.title}
										</span>
									</button>
								))}
							</div>
						)}
					</div>

					{/* Section Field */}
					<div className="relative">
						<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							<FolderOpen className="inline h-4 w-4 mr-1 text-purple-500" />
							Section
						</label>
						<input
							type="text"
							value={sectionQuery}
							onChange={(e) => {
								setSectionQuery(e.target.value);
								setSelectedSection(null);
								setShowSectionDropdown(true);
							}}
							onFocus={() => setShowSectionDropdown(true)}
							onBlur={() =>
								setTimeout(() => setShowSectionDropdown(false), 150)
							}
							onKeyDown={handleSectionKeyDown}
							placeholder="Type to search or create..."
							disabled={!bookQuery.trim() && !selectedBook}
							className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
							autoComplete="off"
						/>
						<p className="mt-1 text-xs">{getSectionHelper()}</p>

						{/* Section Dropdown */}
						{showSectionDropdown && filteredSections.length > 0 && (
							<div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
								{filteredSections.map((section, index) => (
									<button
										key={section.id}
										onMouseDown={() => selectSection(section)}
										className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${
											index === sectionHighlightIndex
												? "bg-blue-50 dark:bg-blue-900/30"
												: "hover:bg-gray-100 dark:hover:bg-gray-600"
										}`}
									>
										<FolderOpen className="h-4 w-4 text-purple-500" />
										<span className="text-gray-900 dark:text-gray-100">
											{section.title}
										</span>
									</button>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
					<span className="text-xs text-gray-500 dark:text-gray-400">
						Press Escape to cancel
					</span>
					<button
						onClick={handleSubmit}
						disabled={!noteTitle.trim()}
						className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Create Note
					</button>
				</div>
			</div>
		</div>
	);

	return createPortal(dialogContent, document.body);
};
