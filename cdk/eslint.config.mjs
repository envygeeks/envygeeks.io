import parser from '@typescript-eslint/parser';
import tslint from '@typescript-eslint/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import t_eslint from 'typescript-eslint';

/**
 * There is a bug with
 * `@stylistic/indent` where it
 * doesn't seem to properly detect the
 * node and allow its exclusion
 */
const originalRules = stylistic.configs.recommended;
const { '@stylistic/indent': _, ...newRules } = originalRules.rules;
const recommendedRules = {
  ...originalRules,
  rules: newRules,
};

/**
 */
export default t_eslint.config(
  recommendedRules,
  // perfectionist.configs['recommended-natural'],
  t_eslint.configs.recommendedTypeChecked,
  {
    ignores: [
      'cdk.out/',
      'node_modules/',
      'cdk.context.json',
      'cdk.output.json',
      'outputs.json',
      '**/*.d.ts',
    ],
  },
  {
    languageOptions: {
      parser: parser,
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            // '*.js', '*.mjs', '*.cjs',
          ],
        },
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        sourceType: 'module',
        ecmaVersion: 2020,
      },
    },
  },
  {
    files: ['**/*.{ts,js,cjs,mjs}'],
    plugins: {
      '@stylistic': stylistic,
      '@typescript-eslint': tslint,
    },
    rules: {
      'indent': [
        'error', 2, {
          ignoredNodes: [
            'ClassDeclaration',
            'InterfaceDeclaration',
          ],
        },
      ],
      '@stylistic/no-extra-semi': 'error',
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@typescript-eslint/no-floating-promises': 'error',
      '@stylistic/no-non-null-assertion': 'off',
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/no-explicit-any': 'off',
      '@typescript-eslint/no-explicit-any': [
        'error', {
          ignoreRestArgs: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    rules: Object.fromEntries(
      Object.keys(tslint.rules).map(
        rule => [
          `@typescript-eslint/${rule}`, 'off',
        ],
      ),
    ),
  },
);
