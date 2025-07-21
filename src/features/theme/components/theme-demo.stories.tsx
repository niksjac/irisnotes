import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '../../../shared/components/button';
import { Input } from '../../../shared/components/input';
import { Modal } from '../../../shared/components/modal';

// Theme Demo Component for showcasing theme switching
const ThemeDemo = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newMode);
  };

  return (
    <div className='p-8 min-h-screen bg-white dark:bg-gray-900 transition-colors'>
      <div className='max-w-4xl mx-auto space-y-8'>
        {/* Header */}
        <header className='text-center'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-4'>Theme System Demo</h1>
          <p className='text-gray-600 dark:text-gray-300'>
            Interactive demonstration of the application's theme system with light/dark mode support.
          </p>
        </header>

        {/* Theme Controls */}
        <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6'>
          <h2 className='text-xl font-semibold text-gray-900 dark:text-white mb-4'>Theme Controls</h2>
          <div className='flex items-center gap-4'>
            <Button onClick={toggleTheme} variant='primary'>
              Switch to {darkMode ? 'Light' : 'Dark'} Mode
            </Button>
            <span className='text-sm text-gray-600 dark:text-gray-300'>
              Current theme: <strong>{darkMode ? 'Dark' : 'Light'}</strong>
            </span>
          </div>
        </div>

        {/* Component Showcase */}
        <div className='grid md:grid-cols-2 gap-8'>
          {/* Buttons */}
          <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Button Variants</h3>
            <div className='space-y-3'>
              <div className='flex gap-3'>
                <Button variant='primary' size='sm'>
                  Primary
                </Button>
                <Button variant='secondary' size='sm'>
                  Secondary
                </Button>
                <Button variant='danger' size='sm'>
                  Danger
                </Button>
                <Button variant='ghost' size='sm'>
                  Ghost
                </Button>
              </div>
              <div className='flex gap-3'>
                <Button variant='primary'>Primary</Button>
                <Button variant='secondary'>Secondary</Button>
                <Button variant='danger'>Danger</Button>
                <Button variant='ghost'>Ghost</Button>
              </div>
              <div className='flex gap-3'>
                <Button variant='primary' size='lg'>
                  Primary Large
                </Button>
                <Button variant='secondary' size='lg'>
                  Secondary Large
                </Button>
              </div>
            </div>
          </div>

          {/* Inputs */}
          <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Input Fields</h3>
            <div className='space-y-4'>
              <Input label='Normal Input' placeholder='Enter some text...' />
              <Input
                label='Input with Help Text'
                placeholder='Email address'
                helpText="We'll never share your email"
                type='email'
              />
              <Input
                label='Input with Error'
                placeholder='This has an error'
                error='This field is required'
                value='invalid@'
              />
              <Input label='Disabled Input' placeholder='This is disabled' disabled />
            </div>
          </div>
        </div>

        {/* Typography & Text Colors */}
        <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Typography & Colors</h3>
          <div className='space-y-3'>
            <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>Heading 1 - Primary Text</h1>
            <h2 className='text-xl font-semibold text-gray-800 dark:text-gray-100'>Heading 2 - Secondary Text</h2>
            <p className='text-gray-700 dark:text-gray-200'>
              Regular paragraph text with good contrast in both light and dark modes.
            </p>
            <p className='text-gray-600 dark:text-gray-300'>Muted text for secondary information.</p>
            <p className='text-gray-500 dark:text-gray-400'>Subtle text for tertiary information.</p>
            <div className='flex gap-4 items-center'>
              <span className='text-blue-600 dark:text-blue-400'>Link color</span>
              <span className='text-green-600 dark:text-green-400'>Success color</span>
              <span className='text-red-600 dark:text-red-400'>Error color</span>
              <span className='text-yellow-600 dark:text-yellow-400'>Warning color</span>
            </div>
          </div>
        </div>

        {/* Interactive Elements */}
        <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Interactive Elements</h3>
          <div className='flex gap-4'>
            <Button onClick={() => setIsModalOpen(true)}>Open Modal Demo</Button>
            <button className='px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors'>
              Custom Button
            </button>
          </div>
        </div>

        {/* Color Palette */}
        <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Color Palette</h3>
          <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='w-16 h-16 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg mx-auto mb-2'></div>
              <span className='text-sm text-gray-600 dark:text-gray-300'>Background</span>
            </div>
            <div className='text-center'>
              <div className='w-16 h-16 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg mx-auto mb-2'></div>
              <span className='text-sm text-gray-600 dark:text-gray-300'>Surface</span>
            </div>
            <div className='text-center'>
              <div className='w-16 h-16 bg-blue-600 rounded-lg mx-auto mb-2'></div>
              <span className='text-sm text-gray-600 dark:text-gray-300'>Primary</span>
            </div>
            <div className='text-center'>
              <div className='w-16 h-16 bg-gray-600 dark:bg-gray-400 rounded-lg mx-auto mb-2'></div>
              <span className='text-sm text-gray-600 dark:text-gray-300'>Secondary</span>
            </div>
          </div>
        </div>

        {/* Borders & Shadows */}
        <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>Borders & Shadows</h3>
          <div className='grid sm:grid-cols-3 gap-4'>
            <div className='p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg'>
              <span className='text-sm text-gray-600 dark:text-gray-300'>Subtle border</span>
            </div>
            <div className='p-4 bg-white dark:bg-gray-900 shadow-sm dark:shadow-none border border-gray-200 dark:border-gray-700 rounded-lg'>
              <span className='text-sm text-gray-600 dark:text-gray-300'>Light shadow</span>
            </div>
            <div className='p-4 bg-white dark:bg-gray-900 shadow-lg dark:shadow-none border border-gray-200 dark:border-gray-700 rounded-lg'>
              <span className='text-sm text-gray-600 dark:text-gray-300'>Strong shadow</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Demo */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title='Theme-Aware Modal' size='md'>
        <div className='space-y-4'>
          <p className='text-gray-700 dark:text-gray-200'>
            This modal demonstrates how components adapt to the current theme. Notice how colors, borders, and
            backgrounds change seamlessly.
          </p>
          <Input label='Input in Modal' placeholder='Try typing here...' />
          <div className='flex justify-end gap-3 pt-4'>
            <Button variant='secondary' onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant='primary' onClick={() => setIsModalOpen(false)}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const meta = {
  title: 'Features/Theme/Demo',
  component: ThemeDemo,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Interactive demonstration of the theme system with light/dark mode switching and component adaptation.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ThemeDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

// Light theme demo
export const LightTheme: Story = {
  parameters: {
    themes: {
      themeOverride: 'light',
    },
  },
};

// Dark theme demo
export const DarkTheme: Story = {
  parameters: {
    themes: {
      themeOverride: 'dark',
    },
  },
};

// Interactive theme switching
export const Interactive: Story = {
  render: () => <ThemeDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Interactive theme demo with real-time switching between light and dark modes.',
      },
    },
  },
};

// Component comparison
export const ComponentComparison: Story = {
  render: () => (
    <div className='grid md:grid-cols-2 gap-8 p-8'>
      {/* Light Theme Column */}
      <div className='space-y-6' data-theme='light'>
        <h2 className='text-xl font-bold text-gray-900 text-center'>Light Theme</h2>
        <div className='bg-white border border-gray-200 rounded-lg p-6 space-y-4'>
          <Button variant='primary'>Primary Button</Button>
          <Button variant='secondary'>Secondary Button</Button>
          <Input label='Sample Input' placeholder='Enter text...' />
          <Input label='Input with Error' placeholder='Error state' error='This field has an error' />
        </div>
      </div>

      {/* Dark Theme Column */}
      <div className='space-y-6 dark' data-theme='dark'>
        <h2 className='text-xl font-bold text-white text-center'>Dark Theme</h2>
        <div className='bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4'>
          <Button variant='primary'>Primary Button</Button>
          <Button variant='secondary'>Secondary Button</Button>
          <Input label='Sample Input' placeholder='Enter text...' />
          <Input label='Input with Error' placeholder='Error state' error='This field has an error' />
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: 'Side-by-side comparison of components in light and dark themes.',
      },
    },
  },
};
