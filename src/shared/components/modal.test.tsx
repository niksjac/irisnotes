import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../__tests__/test-utils';
import { Modal } from './modal';

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  children: <div>Modal content</div>,
};

describe('Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders when open', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<Modal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
    });

    it('renders with title', () => {
      render(<Modal {...defaultProps} title='Test Modal' />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Test Modal');
    });

    it('renders without title', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it('renders close button by default', () => {
      render(<Modal {...defaultProps} title='Test Modal' />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('hides close button when showCloseButton is false', () => {
      render(<Modal {...defaultProps} title='Test Modal' showCloseButton={false} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows close button without title when showCloseButton is true', () => {
      render(<Modal {...defaultProps} showCloseButton={true} />);

      const closeButton = screen.getByRole('button');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('sizes', () => {
    it('applies small size class', () => {
      render(<Modal {...defaultProps} size='sm' />);

      const modal = screen.getByText('Modal content').closest('.max-w-md');
      expect(modal).toBeInTheDocument();
    });

    it('applies medium size class (default)', () => {
      render(<Modal {...defaultProps} size='md' />);

      const modal = screen.getByText('Modal content').closest('.max-w-lg');
      expect(modal).toBeInTheDocument();
    });

    it('applies large size class', () => {
      render(<Modal {...defaultProps} size='lg' />);

      const modal = screen.getByText('Modal content').closest('.max-w-2xl');
      expect(modal).toBeInTheDocument();
    });

    it('applies extra large size class', () => {
      render(<Modal {...defaultProps} size='xl' />);

      const modal = screen.getByText('Modal content').closest('.max-w-4xl');
      expect(modal).toBeInTheDocument();
    });

    it('defaults to medium size', () => {
      render(<Modal {...defaultProps} />);

      const modal = screen.getByText('Modal content').closest('.max-w-lg');
      expect(modal).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onClose when close button is clicked', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} title='Test Modal' />);

      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      // Click on the backdrop (the fixed inset-0 div)
      const backdrop = document.querySelector('.fixed.inset-0.bg-black');
      expect(backdrop).toBeInTheDocument();

      fireEvent.click(backdrop!);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose when modal content is clicked', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      const modalContent = screen.getByText('Modal content');
      fireEvent.click(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('does not call onClose when modal container is clicked', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      const modalContainer = screen.getByText('Modal content').closest('.relative');
      fireEvent.click(modalContainer!);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('keyboard interactions', () => {
    it('calls onClose when Escape key is pressed', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('does not call onClose for other keys', () => {
      const onClose = vi.fn();
      render(<Modal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });
      fireEvent.keyDown(document, { key: 'Tab' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('focus management', () => {
    it('focuses close button when modal opens', async () => {
      render(<Modal {...defaultProps} title='Test Modal' />);

      await waitFor(() => {
        const closeButton = screen.getByRole('button');
        expect(closeButton).toHaveFocus();
      });
    });

    it('contains focusable elements for accessibility', async () => {
      render(
        <Modal {...defaultProps} title='Test Modal'>
          <div>
            <button>First button</button>
            <button>Second button</button>
          </div>
        </Modal>
      );

      const closeButton = screen.getByRole('button', { name: 'Close modal' });
      const firstButton = screen.getByText('First button');
      const secondButton = screen.getByText('Second button');

      // Verify all buttons are present and focusable
      expect(closeButton).toBeInTheDocument();
      expect(firstButton).toBeInTheDocument();
      expect(secondButton).toBeInTheDocument();

      // Test that buttons can receive focus
      closeButton.focus();
      expect(closeButton).toHaveFocus();

      firstButton.focus();
      expect(firstButton).toHaveFocus();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<Modal {...defaultProps} title='Accessible Modal' />);

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveAttribute('aria-modal', 'true');
    });

    it('associates title with modal via aria-labelledby', () => {
      render(<Modal {...defaultProps} title='Modal Title' />);

      const modal = screen.getByRole('dialog');
      const title = screen.getByText('Modal Title');

      expect(modal).toHaveAttribute('aria-labelledby', title.getAttribute('id'));
    });

    it('has proper role for dialog', () => {
      render(<Modal {...defaultProps} />);

      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
    });

    it('close button has accessible label', () => {
      render(<Modal {...defaultProps} title='Test Modal' />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('backdrop behavior', () => {
    it('renders backdrop with correct styling', () => {
      render(<Modal {...defaultProps} />);

      const backdrop = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      expect(backdrop).toBeInTheDocument();
    });

    it('backdrop has transition classes', () => {
      render(<Modal {...defaultProps} />);

      const backdrop = document.querySelector('.transition-opacity');
      expect(backdrop).toBeInTheDocument();
    });
  });

  describe('content rendering', () => {
    it('renders children in content area', () => {
      render(
        <Modal {...defaultProps}>
          <div data-testid='modal-content'>
            <h3>Custom Content</h3>
            <p>This is custom modal content</p>
          </div>
        </Modal>
      );

      expect(screen.getByTestId('modal-content')).toBeInTheDocument();
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
      expect(screen.getByText('This is custom modal content')).toBeInTheDocument();
    });

    it('renders complex content structures', () => {
      render(
        <Modal {...defaultProps} title='Complex Modal'>
          <form>
            <input type='text' placeholder='Name' />
            <textarea placeholder='Description'></textarea>
            <button type='submit'>Submit</button>
          </form>
        </Modal>
      );

      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Description')).toBeInTheDocument(); // textarea
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    });
  });

  describe('z-index and layering', () => {
    it('has high z-index for proper layering', () => {
      render(<Modal {...defaultProps} />);

      const modalWrapper = document.querySelector('.z-50');
      expect(modalWrapper).toBeInTheDocument();
    });

    it('positions correctly with fixed positioning', () => {
      render(<Modal {...defaultProps} />);

      const modalWrapper = document.querySelector('.fixed.inset-0');
      expect(modalWrapper).toBeInTheDocument();
    });
  });

  describe('animation and transitions', () => {
    it('has transition classes for modal', () => {
      render(<Modal {...defaultProps} />);

      const modal = document.querySelector('.transition-all');
      expect(modal).toBeInTheDocument();
    });

    it('applies transform classes', () => {
      render(<Modal {...defaultProps} />);

      const modal = document.querySelector('.transform');
      expect(modal).toBeInTheDocument();
    });
  });
});
