// ESLint flat config. `npm run lint` runs with --max-warnings=0, so every
// warning fails the build: keep rules meaningful rather than noisy.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: ['dist/', 'dist-ssr/', 'coverage/', 'test-results/', 'playwright-report/', 'android/', 'node_modules/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.worker },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'inline-type-imports', disallowTypeAnnotations: false },
      ],
      // The app never evaluates strings as code; only the sandbox runs learner code.
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
    },
  },
  {
    files: ['src/**/*.tsx'],
    ...jsxA11y.flatConfigs.recommended,
  },
  {
    // The hand-written service worker (plain JavaScript, copied as-is).
    files: ['public/sw.js'],
    languageOptions: { sourceType: 'script', globals: { ...globals.serviceworker } },
  },
  {
    // Node-side scripts, tests and configuration.
    files: ['scripts/**/*.ts', 'tests/**/*.{ts,tsx}', 'playwright/**/*.ts', '*.config.{ts,js}', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
);
