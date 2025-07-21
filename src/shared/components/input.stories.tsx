import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './input';

const meta = {
  title: 'Shared/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A flexible input component with label, error states, and help text support.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Label for the input field',
    },
    error: {
      control: { type: 'text' },
      description: 'Error message to display',
    },
    helpText: {
      control: { type: 'text' },
      description: 'Help text to display below input',
    },
    placeholder: {
      control: { type: 'text' },
    },
    disabled: {
      control: { type: 'boolean' },
    },
    required: {
      control: { type: 'boolean' },
    },
    type: {
      control: { type: 'select' },
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic input
export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

// With label
export const WithLabel: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username',
  },
};

// With help text
export const WithHelpText: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    helpText: 'Must be at least 8 characters long',
  },
};

// Error state
export const WithError: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
    error: 'Please enter a valid email address',
    value: 'invalid-email',
  },
};

// Error overrides help text
export const ErrorOverridesHelpText: Story = {
  args: {
    label: 'Email',
    type: 'email',
    placeholder: 'Enter your email',
    helpText: 'We will never share your email',
    error: 'This field is required',
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'This input is disabled',
    disabled: true,
  },
};

// Required field
export const Required: Story = {
  args: {
    label: 'Required Field',
    placeholder: 'This field is required',
    required: true,
    helpText: 'This field is required',
  },
};

// Different input types
export const Email: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'user@example.com',
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const Number: Story = {
  args: {
    label: 'Age',
    type: 'number',
    placeholder: '25',
    min: 0,
    max: 120,
  },
};

export const Search: Story = {
  args: {
    label: 'Search',
    type: 'search',
    placeholder: 'Search for anything...',
  },
};

// Form example
export const FormExample: Story = {
  render: () => (
    <div className='space-y-6 w-80'>
      <Input label='Full Name' placeholder='John Doe' required />
      <Input label='Email' type='email' placeholder='john@example.com' required />
      <Input label='Phone' type='tel' placeholder='+1 (555) 123-4567' helpText='Include country code' />
      <Input label='Age' type='number' placeholder='25' min={18} max={100} />
      <Input label='Website' type='url' placeholder='https://example.com' />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of multiple inputs in a form layout.',
      },
    },
  },
};

// States showcase
export const AllStates: Story = {
  render: () => (
    <div className='space-y-6 w-80'>
      <Input label='Normal State' placeholder='Normal input' />
      <Input label='With Help Text' placeholder='Input with help' helpText='This is helpful information' />
      <Input label='Error State' placeholder='Input with error' error='This field has an error' value='invalid input' />
      <Input label='Disabled State' placeholder='Disabled input' disabled />
      <Input label='Required Field' placeholder='Required input' required helpText='This field is required' />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Showcase of all possible input states.',
      },
    },
  },
};

// Accessibility example
export const AccessibilityExample: Story = {
  render: () => (
    <div className='space-y-6 w-80'>
      <Input
        label='Accessible Input'
        placeholder='Proper label association'
        helpText='Screen readers will announce this help text'
        aria-describedby='help-text'
      />
      <Input
        label='Error with ARIA'
        placeholder='Input with error'
        error='This error will be announced by screen readers'
        aria-invalid={true}
        aria-describedby='error-message'
      />
      <Input aria-label='Search without visible label' placeholder='Search...' type='search' />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Examples demonstrating accessibility features and ARIA attributes.',
      },
    },
  },
};

// Dark theme example
export const DarkTheme: Story = {
  args: {
    label: 'Dark Theme Input',
    placeholder: 'Optimized for dark theme',
    helpText: 'This input works well in dark mode',
  },
  parameters: {
    themes: {
      themeOverride: 'dark',
    },
  },
};
