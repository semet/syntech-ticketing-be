import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import importPlugin from 'eslint-plugin-import'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'
import unusedImports from 'eslint-plugin-unused-imports'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  {
    ignores: ['dist/**', 'node_modules/**', 'generated/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],

    plugins: {
      import: importPlugin,
      unicorn: eslintPluginUnicorn,
      'unused-imports': unusedImports,
    },
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      ...importPlugin.configs.recommended.rules,
      ...eslintPluginUnicorn.configs.recommended.rules,

      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
          ignore: ['App'],
        },
      ],
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/no-useless-promise-resolve-reject': 'off',
      'unicorn/prevent-abbreviations': [
        'error',
        {
          allowList: {
            ctx: true,
            db: true,
          },
        },
      ],
      'unicorn/no-null': 'off',
      'no-console': 'error',
      'no-empty-pattern': 'off',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../*',
                '../',
                '..',
                '@/configs/*/*/*/*',
                '@/features/*/*/*/*',
                '@/middlewares/*/*/*/*',
                '@/routes/*/*/*/*',
                '@/utils/*/*/*/*',
                '@/types/*/*/*/*',
              ],
            },
          ],
        },
      ],
      'linebreak-style': ['error', 'unix'],
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'object',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import/default': 'off',
      'import/no-named-as-default-member': 'off',
      'import/no-named-as-default': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
  },
])
