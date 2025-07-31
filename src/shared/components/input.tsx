import type React from 'react';
import { cn } from '../utils/cn';
import { generateId } from '../utils/id-generation';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
	error?: string;
	helpText?: string;
}

export function Input({ label, error, helpText, className, id, ...props }: InputProps) {
	const inputId = id || generateId('input');

	return (
		<div className='space-y-1'>
			{label && (
				<label
					htmlFor={inputId}
					className='block text-sm font-medium text-gray-700'
				>
					{label}
				</label>
			)}
			<input
				id={inputId}
				className={cn(
					'block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm',
					'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
					'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
					error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
					className
				)}
				{...props}
			/>
			{error && <p className='text-sm text-red-600'>{error}</p>}
			{helpText && !error && <p className='text-sm text-gray-500'>{helpText}</p>}
		</div>
	);
}
