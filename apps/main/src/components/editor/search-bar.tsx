import { useEffect, useRef, useState, useCallback } from "react";
import { X, ChevronUp, ChevronDown } from "lucide-react";
import type { EditorView } from "prosemirror-view";
import {
	setSearchQuery,
	nextMatch,
	prevMatch,
	closeSearch,
	getSearchState,
} from "./plugins/search";

interface SearchBarProps {
	view: EditorView | null;
	onClose: () => void;
}

export function SearchBar({ view, onClose }: SearchBarProps) {
	const [query, setQuery] = useState("");
	const [matchInfo, setMatchInfo] = useState({ current: 0, total: 0 });
	const inputRef = useRef<HTMLInputElement>(null);

	// Focus input on mount
	useEffect(() => {
		inputRef.current?.focus();
		inputRef.current?.select();
	}, []);

	// Update match info when query changes or view state updates
	const updateMatchInfo = useCallback(() => {
		if (!view) return;
		const state = getSearchState(view.state);
		if (state) {
			setMatchInfo({
				current: state.matches.length > 0 ? state.currentMatchIndex + 1 : 0,
				total: state.matches.length,
			});
		}
	}, [view]);

	// Handle query changes
	const handleQueryChange = useCallback(
		(newQuery: string) => {
			setQuery(newQuery);
			if (view) {
				setSearchQuery(view, newQuery);
				// Wait for state update then get match info
				setTimeout(updateMatchInfo, 0);
			}
		},
		[view, updateMatchInfo]
	);

	// Handle keyboard shortcuts
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				e.preventDefault();
				if (view) {
					closeSearch(view);
					view.focus();
				}
				onClose();
			} else if (e.key === "Enter") {
				e.preventDefault();
				if (e.shiftKey) {
					if (view) {
						prevMatch(view);
						setTimeout(updateMatchInfo, 0);
					}
				} else {
					if (view) {
						nextMatch(view);
						setTimeout(updateMatchInfo, 0);
					}
				}
			} else if (e.key === "F3" || (e.key === "g" && e.ctrlKey)) {
				e.preventDefault();
				if (e.shiftKey) {
					if (view) {
						prevMatch(view);
						setTimeout(updateMatchInfo, 0);
					}
				} else {
					if (view) {
						nextMatch(view);
						setTimeout(updateMatchInfo, 0);
					}
				}
			}
		},
		[view, onClose, updateMatchInfo]
	);

	// Handle next button click
	const handleNext = useCallback(() => {
		if (view) {
			nextMatch(view);
			setTimeout(updateMatchInfo, 0);
		}
	}, [view, updateMatchInfo]);

	// Handle previous button click
	const handlePrev = useCallback(() => {
		if (view) {
			prevMatch(view);
			setTimeout(updateMatchInfo, 0);
		}
	}, [view, updateMatchInfo]);

	// Handle close button click
	const handleClose = useCallback(() => {
		if (view) {
			closeSearch(view);
			view.focus();
		}
		onClose();
	}, [view, onClose]);

	return (
		<div className="search-bar">
			<input
				ref={inputRef}
				type="text"
				className="search-input"
				placeholder="Find in note..."
				value={query}
				onChange={(e) => handleQueryChange(e.target.value)}
				onKeyDown={handleKeyDown}
			/>
			<span className="search-match-count">
				{matchInfo.total > 0
					? `${matchInfo.current} of ${matchInfo.total}`
					: query
						? "No results"
						: ""}
			</span>
			<button
				type="button"
				className="search-nav-btn"
				onClick={handlePrev}
				disabled={matchInfo.total === 0}
				title="Previous match (Shift+Enter)"
			>
				<ChevronUp size={16} />
			</button>
			<button
				type="button"
				className="search-nav-btn"
				onClick={handleNext}
				disabled={matchInfo.total === 0}
				title="Next match (Enter)"
			>
				<ChevronDown size={16} />
			</button>
			<button
				type="button"
				className="search-close-btn"
				onClick={handleClose}
				title="Close (Escape)"
			>
				<X size={16} />
			</button>
		</div>
	);
}
