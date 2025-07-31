import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '../../__tests__/test-utils';
import { Button } from './button';

describe('Button component', () => {
	it('should render with default props', () => {
		render(<Button>Default Button</Button>);

		const button = screen.getByRole('button', { name: 'Default Button' });
		expect(button).toBeInTheDocument();
		expect(button).toHaveClass('bg-blue-600'); // primary variant
		expect(button).toHaveClass('h-10'); // md size
	});

	describe('variants', () => {
		it('should render primary variant correctly', () => {
			render(<Button variant='primary'>Primary</Button>);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('bg-blue-600', 'text-white', 'hover:bg-blue-700');
		});

		it('should render secondary variant correctly', () => {
			render(<Button variant='secondary'>Secondary</Button>);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('bg-gray-200', 'text-gray-900', 'hover:bg-gray-300');
		});

		it('should render danger variant correctly', () => {
			render(<Button variant='danger'>Danger</Button>);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('bg-red-600', 'text-white', 'hover:bg-red-700');
		});

		it('should render ghost variant correctly', () => {
			render(<Button variant='ghost'>Ghost</Button>);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('text-gray-700', 'hover:bg-gray-100');
		});
	});

	describe('sizes', () => {
		it('should render small size correctly', () => {
			render(<Button size='sm'>Small</Button>);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('h-8', 'px-3', 'text-sm');
		});

		it('should render medium size correctly', () => {
			render(<Button size='md'>Medium</Button>);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('h-10', 'px-4', 'text-sm');
		});

		it('should render large size correctly', () => {
			render(<Button size='lg'>Large</Button>);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('h-12', 'px-6', 'text-base');
		});
	});

	describe('states', () => {
		it('should handle disabled state', () => {
			render(<Button disabled>Disabled</Button>);

			const button = screen.getByRole('button');
			expect(button).toBeDisabled();
			expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
		});

		it('should handle loading state', () => {
			render(<Button loading>Loading</Button>);

			const button = screen.getByRole('button');
			expect(button).toBeDisabled();

			// Check for loading spinner
			const spinner = button.querySelector('svg');
			expect(spinner).toBeInTheDocument();
			expect(spinner).toHaveClass('animate-spin');
		});

		it('should show loading spinner and text together', () => {
			render(<Button loading>Save Changes</Button>);

			const button = screen.getByRole('button');
			expect(button).toHaveTextContent('Save Changes');

			const spinner = button.querySelector('svg');
			expect(spinner).toBeInTheDocument();
		});
	});

	describe('interactions', () => {
		it('should call onClick when clicked', async () => {
			const user = userEvent.setup();
			const handleClick = vi.fn();

			render(<Button onClick={handleClick}>Click me</Button>);

			const button = screen.getByRole('button');
			await user.click(button);

			expect(handleClick).toHaveBeenCalledTimes(1);
		});

		it('should not call onClick when disabled', async () => {
			const user = userEvent.setup();
			const handleClick = vi.fn();

			render(
				<Button
					onClick={handleClick}
					disabled
				>
					Click me
				</Button>
			);

			const button = screen.getByRole('button');
			await user.click(button);

			expect(handleClick).not.toHaveBeenCalled();
		});

		it('should not call onClick when loading', async () => {
			const user = userEvent.setup();
			const handleClick = vi.fn();

			render(
				<Button
					onClick={handleClick}
					loading
				>
					Click me
				</Button>
			);

			const button = screen.getByRole('button');
			await user.click(button);

			expect(handleClick).not.toHaveBeenCalled();
		});
	});

	describe('styling', () => {
		it('should merge custom className with default classes', () => {
			render(<Button className='custom-class'>Custom</Button>);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('custom-class');
			expect(button).toHaveClass('inline-flex'); // base class should still be present
		});

		it('should apply focus-visible styles', () => {
			render(<Button>Focus test</Button>);

			const button = screen.getByRole('button');
			expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
		});
	});

	describe('accessibility', () => {
		it('should support aria-label', () => {
			render(<Button aria-label='Close dialog'>×</Button>);

			const button = screen.getByRole('button', { name: 'Close dialog' });
			expect(button).toBeInTheDocument();
		});

		it('should support custom button props', () => {
			render(
				<Button
					type='submit'
					form='test-form'
				>
					Submit
				</Button>
			);

			const button = screen.getByRole('button');
			expect(button).toHaveAttribute('type', 'submit');
			expect(button).toHaveAttribute('form', 'test-form');
		});

		it('should be keyboard accessible', async () => {
			const user = userEvent.setup();
			const handleClick = vi.fn();

			render(<Button onClick={handleClick}>Keyboard test</Button>);

			const button = screen.getByRole('button');
			button.focus();

			await user.keyboard('{Enter}');
			expect(handleClick).toHaveBeenCalledTimes(1);

			await user.keyboard(' ');
			expect(handleClick).toHaveBeenCalledTimes(2);
		});
	});

	describe('edge cases', () => {
		it('should handle undefined children gracefully', () => {
			render(<Button>{undefined}</Button>);

			const button = screen.getByRole('button');
			expect(button).toBeInTheDocument();
			expect(button).toBeEmptyDOMElement();
		});

		it('should handle complex children', () => {
			render(
				<Button>
					<span>Icon</span>
					<span>Text</span>
				</Button>
			);

			const button = screen.getByRole('button');
			expect(button).toHaveTextContent('IconText');
		});
	});
});
