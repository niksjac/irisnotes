import { FileText, Folder, Search } from 'lucide-react';

interface WelcomeScreenProps {
	onCreateNote: () => void;
	onCreateFolder: () => void;
	onFocusSearch?: () => void;
}

export function WelcomeScreen({ onCreateNote, onCreateFolder, onFocusSearch }: WelcomeScreenProps) {
	return (
		<div className='welcome-screen'>
			<div className='welcome-content'>
				<div className='welcome-header'>
					<div className='welcome-icon'>
						<FileText size={48} />
					</div>
					<h1>Welcome to IrisNotes</h1>
					<p>Create your first note or organize with folders to get started.</p>
				</div>

				<div className='welcome-actions'>
					<button
						className='inline-flex flex-col items-center gap-3 p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-w-[120px]'
						onClick={onCreateNote}
						title='Create a new note'
					>
						<FileText size={20} />
						<span>Create Note</span>
					</button>

					<button
						className='inline-flex flex-col items-center gap-3 p-6 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors min-w-[120px]'
						onClick={onCreateFolder}
						title='Create a new folder'
					>
						<Folder size={20} />
						<span>Create Folder</span>
					</button>

					{onFocusSearch && (
						<button
							className='inline-flex flex-col items-center gap-3 p-6 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors min-w-[120px]'
							onClick={onFocusSearch}
							title='Search existing notes'
						>
							<Search size={20} />
							<span>Search Notes</span>
						</button>
					)}
				</div>

				<div className='welcome-tips'>
					<h3>Quick Tips</h3>
					<ul>
						<li>
							<strong>Tab:</strong> Navigate between UI elements
						</li>
						<li>
							<strong>Ctrl+Shift+E:</strong> Focus notes tree
						</li>
						<li>
							<strong>Ctrl+Shift+P:</strong> Focus search
						</li>
						<li>
							<strong>Ctrl+B:</strong> Toggle sidebar
						</li>
						<li>
							<strong>Ctrl+J:</strong> Toggle activity bar
						</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
