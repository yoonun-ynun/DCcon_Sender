import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import nextPlugin from '@next/eslint-plugin-next';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
    ...nextVitals,
    ...nextTs,
    {
        ignores: ['node_modules/', '.next/', 'dist/', 'build/', 'out/'],
    },

    {
        files: ['socket/**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: ['./socket/tsconfig.json'],
                tsconfigRootDir: import.meta.dirname,
                sourceType: 'module',
            },
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            prettier: prettierPlugin,
        },
        rules: {
            ...js.configs.recommended.rules,
            ...tsPlugin.configs.recommended.rules,
            ...prettierConfig.rules,

            'no-redeclare': 'off',
            '@typescript-eslint/no-redeclare': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            'prettier/prettier': 'error',
            'prefer-const': 'error',
            'func-style': ['error', 'declaration', { allowArrowFunctions: false }],
            'no-undef': 'off',
        },
    },

    {
        files: ['src/**/*.{js,jsx,ts,tsx}'],
        plugins: {
            prettier: prettierPlugin,
        },
        rules: {
            ...prettierConfig.rules,

            'prettier/prettier': 'error',
            'prefer-const': 'error',
            'func-style': ['error', 'declaration', { allowArrowFunctions: false }],
        },
    },
];
