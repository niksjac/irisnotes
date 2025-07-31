import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from './button';
import { Modal } from './modal';

const meta = {
	title: 'Shared/Modal',
	component: Modal,
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: 'A modal dialog component with backdrop, keyboard navigation, and focus management.',
			},
		},
	},
	tags: ['autodocs'],
	argTypes: {
		isOpen: {
			control: { type: 'boolean' },
			description: 'Controls whether the modal is visible',
		},
		onClose: {
			action: 'onClose',
			description: 'Callback function called when modal should close',
		},
		title: {
			control: { type: 'text' },
			description: 'Optional title for the modal',
		},
		size: {
			control: { type: 'select' },
			options: ['sm', 'md', 'lg', 'xl'],
			description: 'Size of the modal',
		},
		showCloseButton: {
			control: { type: 'boolean' },
			description: 'Whether to show the close button',
		},
		children: {
			control: { type: 'text' },
			description: 'Content to display in the modal',
		},
	},
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive modal component for stories
const InteractiveModal = ({
	title,
	size,
	showCloseButton = true,
	children,
}: {
	title?: string;
	size?: 'sm' | 'md' | 'lg' | 'xl';
	showCloseButton?: boolean;
	children: React.ReactNode;
}) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className='p-8'>
			<Button onClick={() => setIsOpen(true)}>Open Modal</Button>

			<Modal
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				{...(title && { title })}
				{...(size && { size })}
				showCloseButton={showCloseButton}
			>
				{children}
			</Modal>
		</div>
	);
};

// Default modal
export const Default: Story = {
	args: {
		isOpen: true,
		onClose: () => {},
		children: null,
	},
	render: () => (
		<InteractiveModal>
			<p>This is a basic modal with default settings.</p>
			<p className='mt-2 text-gray-600'>
				You can close this modal by clicking the X button, clicking the backdrop, or pressing the Escape key.
			</p>
		</InteractiveModal>
	),
};

// With title
export const WithTitle: Story = {
	args: {
		isOpen: true,
		onClose: () => {},
		children: null,
	},
	render: () => (
		<InteractiveModal title='Modal Title'>
			<p>This modal has a title in the header.</p>
			<p className='mt-2 text-gray-600'>The title is properly associated with the modal for screen readers.</p>
		</InteractiveModal>
	),
};

// Different sizes
export const SmallSize: Story = {
	args: {
		isOpen: true,
		onClose: () => {},
		children: null,
	},
	render: () => (
		<InteractiveModal
			title='Small Modal'
			size='sm'
		>
			<p>This is a small modal (max-width: 448px).</p>
			<p className='mt-2 text-gray-600'>Perfect for simple confirmations or alerts.</p>
		</InteractiveModal>
	),
};

export const MediumSize: Story = {
	args: {
		isOpen: true,
		onClose: () => {},
		children: null,
	},
	render: () => (
		<InteractiveModal
			title='Medium Modal'
			size='md'
		>
			<p>This is a medium modal (max-width: 512px) - the default size.</p>
			<p className='mt-2 text-gray-600'>Good for most dialog content and forms.</p>
		</InteractiveModal>
	),
};

export const LargeSize: Story = {
	args: {
		isOpen: true,
		onClose: () => {},
		children: null,
	},
	render: () => (
		<InteractiveModal
			title='Large Modal'
			size='lg'
		>
			<p>This is a large modal (max-width: 672px).</p>
			<p className='mt-2 text-gray-600'>Suitable for complex forms or detailed content.</p>
		</InteractiveModal>
	),
};

export const ExtraLargeSize: Story = {
	args: {
		isOpen: true,
		onClose: () => {},
		children: null,
	},
	render: () => (
		<InteractiveModal
			title='Extra Large Modal'
			size='xl'
		>
			<p>This is an extra large modal (max-width: 896px).</p>
			<p className='mt-2 text-gray-600'>Use for complex layouts, data tables, or rich content.</p>
		</InteractiveModal>
	),
};

// Without close button
export const WithoutCloseButton: Story = {
	args: {
		isOpen: true,
		onClose: () => {},
		children: null,
	},
	render: () => (
		<InteractiveModal
			title='No Close Button'
			showCloseButton={false}
		>
			<p>This modal doesn't have a close button in the header.</p>
			<p className='mt-2 text-gray-600'>You can still close it by clicking the backdrop or pressing Escape.</p>
			<div className='mt-4'>
				<Button variant='secondary'>Cancel</Button>
			</div>
		</InteractiveModal>
	),
};

// Form example
export const FormExample: Story = {
	args: {
		isOpen: true,
		onClose: () => {},
		children: null,
	},
	render: () => (
		<InteractiveModal
			title='Create New Item'
			size='md'
		>
			<form className='space-y-4'>
				<div>
					<label
						htmlFor='item-name'
						className='block text-sm font-medium text-gray-700'
					>
						Item Name
					</label>
					<input
						type='text'
						id='item-name'
						className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
						placeholder='Enter item name'
					/>
				</div>

				<div>
					<label
						htmlFor='description'
						className='block text-sm font-medium text-gray-700'
					>
						Description
					</label>
					<textarea
						id='description'
						rows={3}
						className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
						placeholder='Enter description'
					/>
				</div>

				<div>
					<label
						htmlFor='category'
						className='block text-sm font-medium text-gray-700'
					>
						Category
					</label>
					<select
						id='category'
						className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
					>
						<option>Select a category</option>
						<option>Work</option>
						<option>Personal</option>
						<option>Important</option>
					</select>
				</div>

				<div className='flex justify-end space-x-3 pt-4'>
					<Button variant='secondary'>Cancel</Button>
					<Button variant='primary'>Create Item</Button>
				</div>
			</form>
		</InteractiveModal>
	),
};

// Confirmation dialog
export const ConfirmationDialog: Story = {
	args: {
		isOpen: true,
		onClose: () => {},
		children: null,
	},
	render: () => (
		<InteractiveModal
			title='Confirm Action'
			size='sm'
		>
			<div className='text-center'>
				<div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4'>
					<svg
						className='h-6 w-6 text-red-600'
						fill='none'
						viewBox='0 0 24 24'
						stroke='currentColor'
					>
						<path
							strokeLinecap='round'
							strokeLinejoin='round'
							strokeWidth={2}
							d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z'
						/>
					</svg>
				</div>

				<h3 className='text-lg font-medium text-gray-900 mb-2'>Delete Item</h3>
				<p className='text-gray-600 mb-6'>Are you sure you want to delete this item? This action cannot be undone.</p>

				<div className='flex justify-center space-x-3'>
					<Button variant='secondary'>Cancel</Button>
					<Button variant='danger'>Delete</Button>
				</div>
			</div>
		</InteractiveModal>
	),
};

// Long content example
export const LongContentExample: Story = {
	args: {
		isOpen: true,
		onClose: () => {},
		children: null,
	},
	render: () => (
		<InteractiveModal
			title='Terms of Service'
			size='lg'
		>
			<div className='space-y-4 max-h-96 overflow-y-auto'>
				<h3 className='text-lg font-semibold'>1. Terms</h3>
				<p className='text-gray-600'>
					By accessing and using this service, you accept and agree to be bound by the terms and provision of this
					agreement.
				</p>

				<h3 className='text-lg font-semibold'>2. Use License</h3>
				<p className='text-gray-600'>
					Permission is granted to temporarily download one copy of the materials on this service for personal,
					non-commercial transitory viewing only.
				</p>

				<h3 className='text-lg font-semibold'>3. Disclaimer</h3>
				<p className='text-gray-600'>
					The materials on this service are provided on an 'as is' basis. This service makes no warranties, expressed or
					implied, and hereby disclaim and negate all other warranties including without limitation, implied warranties
					or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual
					property or other violation of rights.
				</p>

				<h3 className='text-lg font-semibold'>4. Limitations</h3>
				<p className='text-gray-600'>
					In no event shall this service or its suppliers be liable for any damages (including, without limitation,
					damages for loss of data or profit, or due to business interruption) arising out of the use or inability to
					use the materials on this service, even if this service or its authorized representative has been notified
					orally or in writing of the possibility of such damage.
				</p>

				<div className='pt-4 border-t'>
					<div className='flex justify-end space-x-3'>
						<Button variant='secondary'>Decline</Button>
						<Button variant='primary'>Accept</Button>
					</div>
				</div>
			</div>
		</InteractiveModal>
	),
};

// Accessibility demonstration
export const AccessibilityDemo: Story = {
	args: {
		isOpen: true,
		onClose: () => {},
		children: null,
	},
	render: () => (
		<InteractiveModal title='Accessibility Features'>
			<div className='space-y-4'>
				<h3 className='text-lg font-semibold'>Keyboard Navigation</h3>
				<ul className='list-disc list-inside text-gray-600 space-y-1'>
					<li>
						<kbd className='px-2 py-1 bg-gray-100 rounded text-xs'>Escape</kbd> - Close modal
					</li>
					<li>
						<kbd className='px-2 py-1 bg-gray-100 rounded text-xs'>Tab</kbd> - Navigate focusable elements
					</li>
					<li>
						<kbd className='px-2 py-1 bg-gray-100 rounded text-xs'>Shift + Tab</kbd> - Navigate backwards
					</li>
				</ul>

				<h3 className='text-lg font-semibold'>Screen Reader Support</h3>
				<ul className='list-disc list-inside text-gray-600 space-y-1'>
					<li>Proper ARIA attributes (role="dialog", aria-modal="true")</li>
					<li>Title association with aria-labelledby</li>
					<li>Focus management (focus returns to trigger on close)</li>
					<li>Accessible close button labeling</li>
				</ul>

				<div className='pt-4'>
					<Button variant='primary'>Got it!</Button>
				</div>
			</div>
		</InteractiveModal>
	),
};

// Dark theme example
export const DarkTheme: Story = {
	args: {
		isOpen: true,
		onClose: () => {},
		children: null,
	},
	render: () => (
		<InteractiveModal title='Dark Theme Modal'>
			<p>This modal adapts to dark theme when available.</p>
			<p className='mt-2 text-gray-600'>The styling automatically adjusts for better visibility in dark mode.</p>
		</InteractiveModal>
	),
	parameters: {
		themes: {
			themeOverride: 'dark',
		},
	},
};
