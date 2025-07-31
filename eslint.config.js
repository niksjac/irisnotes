import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import prettier from 'eslint-plugin-prettier';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
	{
		files: ['**/*.{ts,tsx,js,jsx}'],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				...globals.browser,
				...globals.node,
				...globals.es2021,
			},
		},
		plugins: {
			'@typescript-eslint': tseslint,
			react,
			'react-hooks': reactHooks,
			prettier,
		},
		rules: {
			// Essential JS rules
			'no-unused-vars': 'off',
			'no-undef': 'off', // TypeScript handles this better

			// TypeScript rules - keep minimal
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'@typescript-eslint/no-explicit-any': 'off', // Too strict for practical development

			// React rules - essential only
			'react/react-in-jsx-scope': 'off',
			'react/prop-types': 'off',
			'react/display-name': 'off', // Not critical for development
			'react/no-unescaped-entities': 'off', // Too pedantic

			// React Hooks - keep the important ones
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',

			// Prettier integration - disabled to avoid formatting linting errors
			// 'prettier/prettier': 'error',

			// Formatting rules - disabled to prevent linting errors
			'operator-linebreak': 'off',
			'object-curly-newline': 'off',
			'function-paren-newline': 'off',
			'indent': 'off',
			'quotes': 'off',
			'semi': 'off',
			'comma-dangle': 'off',
			'max-len': 'off',

			// Let prettier handle these
			...prettierConfig.rules,
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
	},
	{
		// Even more relaxed rules for test and story files
		files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', '**/*.stories.{ts,tsx}'],
		rules: {
			'@typescript-eslint/no-unused-vars': 'off',
			'react-hooks/exhaustive-deps': 'off',
			'react-hooks/rules-of-hooks': 'off', // Stories can use hooks in render functions
		},
	},
	{
		ignores: [
			'dist/**',
			'coverage/**',
			'node_modules/**',
			'src-tauri/**',
			'build/**',
			'storybook-static/**',
			'playwright-report/**',
			'test-results/**',
		],
	},
];
