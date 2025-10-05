import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',          // allow any
      '@typescript-eslint/no-empty-object-type': 'off',     // allow {}
      '@typescript-eslint/no-unused-vars': 'warn',          // warning only
      'react-hooks/exhaustive-deps': 'warn',               // warning only
      'react/no-unescaped-entities': 'off',
    },
  },
];
