import { createPortal } from "react-dom";
import { useEffect, useRef, useState, type FC } from "react";
import { Layers } from "lucide-react";
import type { FlexibleItem } from "@/types/items";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onCreate: (title: string, bookId: string) => void;
	books: FlexibleItem[];
}

export const NewSectionDialog: FC<Props> = ({ isOpen, onClose, onCreate, books }) => {
	const [title, setTitle] = useState("");
	const [selectedBookId, setSelectedBookId] = useState("");
	const titleInputRef = useRef<HTMLInputElement>(null);
	const dialogRef = useRef<HTMLDivElement>(null);

	// Focus and reset on open
	useEffect(() => {
		if (isOpen) {
			setTitle("");
			// Pre-select first book if available
			setSelectedBookId(books[0]?.id ?? "");
			setTimeout(() => {
				titleInputRef.current?.focus();
			}, 0);
		}
	}, [isOpen, books]);

	// Click outside to close
	useEffect(() => {
		if (!isOpen) return;
		const handleMouseDown = (e: MouseEvent) => {
			if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
				onClose();
			}
		};
		const id = setTimeout(() => document.addEventListener("mousedown", handleMouseDown), 0);
		return () => {
			clearTimeout(id);
			document.removeEventListener("mousedown", handleMouseDown);
		};
	}, [isOpen, onClose]);

	const handleConfirm = () => {
		if (!selectedBookId) return;
		onCreate(title.trim() || "Untitled Section", selectedBookId);
		onClose();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleConfirm();
		} else if (e.key === "Escape") {
			e.preventDefault();
			onClose();
		}
	};

	if (!isOpen) return null;

	const hasBooks = books.length > 0;

	return createPortal(
		<div className="fixed inset-0 z-50 flex items-start justify-center pt-[8vh] bg-black/40">
			<div
				ref={dialogRef}
				className="w-full max-w-[480px] bg-white dark:bg-gray-800 rounded-md shadow-2xl border border-gray-300 dark:border-gray-600 overflow-hidden"
			>
				{/* Header */}
				<div className="flex items-center gap-2.5 px-3 py-2.5 border-b border-gray-200 dark:border-gray-700">
					<Layers className="w-4 h-4 text-purple-500 flex-shrink-0" />
					<span className="text-sm font-medium text-gray-700 dark:text-gray-200">
						New Section
					</span>
				</div>

				{/* Content */}
				<div className="px-3 py-2.5 flex flex-col gap-2.5">
					{/* Book selector */}
					<div>
						<label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
							Book <span className="text-red-400">*</span>
						</label>
						{hasBooks ? (
							<select
								value={selectedBookId}
								onChange={(e) => setSelectedBookId(e.target.value)}
								onKeyDown={handleKeyDown}
								className="w-full bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500 dark:focus:border-blue-400"
							>
								{books.map((book) => (
									<option key={book.id} value={book.id}>
										{book.title}
									</option>
								))}
							</select>
						) : (
							<p className="text-xs text-amber-500 dark:text-amber-400">
								No books found. Create a book first.
							</p>
						)}
					</div>

					{/* Section title */}
					<div>
						<label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
							Section Title
						</label>
						<input
							ref={titleInputRef}
							type="text"
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Untitled Section"
							className="w-full bg-transparent border-none outline-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
						/>
					</div>
				</div>

				{/* Footer */}
				<div className="flex justify-end gap-2 px-3 py-2 border-t border-gray-200 dark:border-gray-700">
					<button
						onClick={onClose}
						className="px-3 py-1 text-xs rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={handleConfirm}
						disabled={!hasBooks || !selectedBookId}
						className="px-3 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Create
					</button>
				</div>
			</div>
		</div>,
		document.body
	);
};
