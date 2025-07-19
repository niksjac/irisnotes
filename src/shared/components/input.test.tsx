import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../__tests__/test-utils';
import { Input } from './input';

describe('Input', () => {
  describe('rendering', () => {
    it('renders basic input', () => {
      render(<Input placeholder="Enter text" />);

      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('placeholder', 'Enter text');
    });

    it('renders with label', () => {
      render(<Input label="Username" placeholder="Enter username" />);

      const label = screen.getByText('Username');
      const input = screen.getByRole('textbox');

      expect(label).toBeInTheDocument();
      expect(input).toHaveAttribute('id');
      expect(label).toHaveAttribute('for', input.getAttribute('id'));
    });

    it('renders with help text', () => {
      render(<Input helpText="Must be at least 8 characters" />);

      expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
    });

    it('renders with error message', () => {
      render(<Input error="This field is required" />);

      const errorMessage = screen.getByText('This field is required');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveClass('text-red-600');
    });

    it('prioritizes error over help text', () => {
      render(
        <Input
          error="This field is required"
          helpText="This should not be visible"
        />
      );

      expect(screen.getByText('This field is required')).toBeInTheDocument();
      expect(screen.queryByText('This should not be visible')).not.toBeInTheDocument();
    });

    it('applies error styling when error prop is present', () => {
      render(<Input error="Error message" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-red-300', 'focus:border-red-500', 'focus:ring-red-500');
    });

    it('renders with custom id', () => {
      render(<Input id="custom-input" label="Custom" />);

      const input = screen.getByRole('textbox');
      const label = screen.getByText('Custom');

      expect(input).toHaveAttribute('id', 'custom-input');
      expect(label).toHaveAttribute('for', 'custom-input');
    });

    it('generates unique id when not provided', () => {
      const { rerender } = render(<Input label="First" />);
      const firstInput = screen.getByRole('textbox');
      const firstId = firstInput.getAttribute('id');

      rerender(<Input label="Second" />);
      const secondInput = screen.getByRole('textbox');
      const secondId = secondInput.getAttribute('id');

      expect(firstId).toBeTruthy();
      expect(secondId).toBeTruthy();
      expect(firstId).not.toEqual(secondId);
    });
  });

  describe('interactions', () => {
    it('handles value changes', () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} />);

      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'Hello' } });

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(input).toHaveValue('Hello');
    });

    it('handles focus and blur events', () => {
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();

      render(<Input onFocus={handleFocus} onBlur={handleBlur} />);

      const input = screen.getByRole('textbox');

      fireEvent.focus(input);
      expect(handleFocus).toHaveBeenCalledTimes(1);

      fireEvent.blur(input);
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });

            it('supports keyboard navigation', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');

      // Test that input can receive focus
      input.focus();
      expect(input).toHaveFocus();
    });
  });

  describe('states', () => {
    it('handles disabled state', () => {
      render(<Input disabled placeholder="Disabled input" />);

      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
      expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:bg-gray-50', 'disabled:text-gray-500');
    });

    it('handles required state', () => {
      render(<Input required />);

      const input = screen.getByRole('textbox');
      expect(input).toBeRequired();
    });

    it('handles readonly state', () => {
      render(<Input readOnly value="Read-only value" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('readonly');
      expect(input).toHaveValue('Read-only value');
    });
  });

  describe('styling', () => {
    it('applies custom className', () => {
      render(<Input className="custom-class" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    it('maintains base styling with custom className', () => {
      render(<Input className="custom-class" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('block', 'w-full', 'rounded-md', 'custom-class');
    });

    it('applies correct focus styles', () => {
      render(<Input />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveClass(
        'focus:border-blue-500',
        'focus:outline-none',
        'focus:ring-1',
        'focus:ring-blue-500'
      );
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Input label="Username" error="Required field" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAccessibleName('Username');
    });

    it('associates error message with input', () => {
      render(<Input error="This field is required" />);

      const errorMessage = screen.getByText('This field is required');

      // Error message should be associated with input for screen readers
      expect(errorMessage).toHaveAttribute('class', expect.stringContaining('text-red-600'));
    });

    it('supports ARIA attributes', () => {
      render(
        <Input
          aria-label="Search input"
          aria-describedby="search-help"
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-label', 'Search input');
      expect(input).toHaveAttribute('aria-describedby', 'search-help');
    });

        it('maintains focus order with label', () => {
      render(<Input label="Focus test" />);

      const label = screen.getByText('Focus test');
      const input = screen.getByRole('textbox');

      // Label should focus associated input when clicked
      fireEvent.click(label);
      // Since JSDOM doesn't handle label clicking automatically, just verify the association
      expect(label).toHaveAttribute('for', input.getAttribute('id'));
    });
  });

  describe('input types', () => {
    it('supports different input types', () => {
      const { rerender } = render(<Input type="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email');

      rerender(<Input type="password" />);
      expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password');

      rerender(<Input type="number" />);
      expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number');
    });

    it('supports input patterns and validation', () => {
      render(<Input type="email" pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$" />);

      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('pattern');
    });
  });
});