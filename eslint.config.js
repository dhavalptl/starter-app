import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import jestPlugin from 'eslint-plugin-jest'
import testingLibrary from 'eslint-plugin-testing-library'
import jestDom from 'eslint-plugin-jest-dom'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'e2e',
    'public/mockServiceWorker.js',
  ]),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: [
      'server/**/*.{ts,tsx}',
      'tests/pvt/**/*.{ts,tsx}',
      'scripts/**/*.{js,mjs}',
      'vite/**/*.{ts,tsx}',
    ],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['tests/app/**/*.{ts,tsx}', 'tests/mocks/**/*.{ts,tsx}', 'tests/setup.ts'],
    extends: [
      jestPlugin.configs['flat/recommended'],
      jestPlugin.configs['flat/style'],
      testingLibrary.configs['flat/react'],
      jestDom.configs['flat/recommended'],
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'react-refresh/only-export-components': 'off',
      'testing-library/render-result-naming-convention': 'off',
      'testing-library/no-node-access': 'off',
    },
  },
])
