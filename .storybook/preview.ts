import type { Preview } from '@storybook/react-vite'
import '../src/styles/tailwind.css'
import '../src/styles/theme.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
    themes: {
      default: 'light',
      list: [
        {
          name: 'light',
          class: '',
          color: '#f9fafb'
        },
        {
          name: 'dark',
          class: 'dark',
          color: '#111827'
        }
      ]
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#f9fafb',
        },
        {
          name: 'dark',
          value: '#111827',
        },
      ],
    },
  },
};

export default preview;