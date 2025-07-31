import { X } from 'lucide-react';
import type React from 'react';
import { useEffect, useRef } from 'react';
import { cn } from '../utils/cn';
import { generateId } from '../utils/id-generation';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	showCloseButton?: boolean;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', showCloseButton = true }: ModalProps) {
	const modalRef = useRef<HTMLDivElement>(null);
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const titleId = generateId('modal-title');

	const sizes = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl',
	};

	// Handle escape key
	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isOpen) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener('keydown', handleEscape);
			return () => document.removeEventListener('keydown', handleEscape);
		}

		return undefined;
	}, [isOpen, onClose]);

	// Focus management
	useEffect(() => {
		if (isOpen && closeButtonRef.current) {
			closeButtonRef.current.focus();
		}
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div className='fixed inset-0 z-50 overflow-y-auto'>
			{/* Backdrop */}
			<div
				className='fixed inset-0 bg-black bg-opacity-50 transition-opacity'
				onClick={onClose}
				aria-hidden='true'
			/>

			{/* Modal */}
			<div className='flex min-h-full items-center justify-center p-4'>
				<div
					ref={modalRef}
					role='dialog'
					aria-modal='true'
					aria-labelledby={title ? titleId : undefined}
					className={cn('relative w-full transform rounded-lg bg-white shadow-xl transition-all', sizes[size])}
					onClick={e => e.stopPropagation()}
				>
					{/* Header */}
					{(title || showCloseButton) && (
						<div className='flex items-center justify-between border-b border-gray-200 px-6 py-4'>
							{title && (
								<h2
									id={titleId}
									className='text-lg font-semibold text-gray-900'
								>
									{title}
								</h2>
							)}
							{showCloseButton && (
								<button
									ref={closeButtonRef}
									onClick={onClose}
									aria-label='Close modal'
									className='rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
								>
									<X
										size={20}
										aria-hidden='true'
									/>
								</button>
							)}
						</div>
					)}

					{/* Content */}
					<div className='px-6 py-4'>{children}</div>
				</div>
			</div>
		</div>
	);
}
