const path = require('path');

require('eslint-plugin-rulesdir').RULES_DIR = path.resolve(__dirname, 'tooling/eslint-rules');

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'rulesdir', 'import'],
  ignorePatterns: [
    'dist',
    'es',
    'src/apis',
    'docs/api',
    'test/environment/ledger/browser',
    'docs/examples',
    'site',
    'examples/browser/tools',
  ],
  rules: {
    'rulesdir/tsdoc-syntax': 'error',
    'no-spaced-func': 'off',
    // TODO: enable rules from below
    'no-underscore-dangle': 'off',
    'no-param-reassign': 'off',
    'no-console': 'off',
    'no-await-in-loop': 'off',
    'no-void': 'off',
  },
  overrides: [
    {
      files: '*.ts',
      extends: [
        'airbnb-typescript/base',
        // TODO: enable extends from below
        // 'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
      rules: {
        '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
        '@typescript-eslint/consistent-type-assertions': [
          'error',
          { assertionStyle: 'as', objectLiteralTypeAssertions: 'never' },
        ],
        '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
        '@typescript-eslint/explicit-function-return-type': [
          'error',
          {
            allowExpressions: true,
            allowHigherOrderFunctions: true,
            allowTypedFunctionExpressions: true,
            allowDirectConstAssertionInArrowFunctions: true,
          },
        ],
        '@typescript-eslint/member-delimiter-style': 'error',
        '@typescript-eslint/method-signature-style': 'error',
        '@typescript-eslint/no-base-to-string': 'error',
        '@typescript-eslint/no-dynamic-delete': 'error',
        // by default allowSingleExtends is false that breaks interfaces for documentation
        '@typescript-eslint/no-empty-interface': ['error', { allowSingleExtends: true }],
        '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
        '@typescript-eslint/no-invalid-void-type': 'error',
        '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
        '@typescript-eslint/prefer-function-type': 'error',
        '@typescript-eslint/prefer-includes': 'error',
        '@typescript-eslint/prefer-nullish-coalescing': [
          'error',
          { ignoreConditionalTests: false, ignoreMixedLogicalExpressions: false },
        ],
        '@typescript-eslint/prefer-optional-chain': 'error',
        '@typescript-eslint/prefer-readonly': 'error',
        '@typescript-eslint/prefer-reduce-type-parameter': 'error',
        '@typescript-eslint/prefer-ts-expect-error': 'error',
        '@typescript-eslint/promise-function-async': 'error',
        '@typescript-eslint/require-array-sort-compare': ['error', { ignoreStringArrays: true }],
        '@typescript-eslint/strict-boolean-expressions': [
          'error',
          {
            allowString: false,
            allowNumber: false,
            allowNullableObject: false,
            allowNullableBoolean: false,
            allowNullableString: false,
            allowNullableNumber: false,
            allowAny: false,
          },
        ],
        '@typescript-eslint/type-annotation-spacing': 'error',
        '@typescript-eslint/indent': 'off',
        // TODO: enable rules from below
        '@typescript-eslint/naming-convention': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/ban-types': 'off',
      },
    },
    {
      files: 'tooling/**/*',
      rules: {
        'import/no-extraneous-dependencies': 'off',
        'no-console': 'off',
      },
    },
    {
      files: 'test/**/*',
      rules: {
        'no-underscore-dangle': 'off',
        // TODO: enable rules from below
        'no-console': 'off',
      },
    },
    {
      files: 'examples/**/*',
      rules: {
        'no-console': 'off',
        'no-alert': 'off',
        'no-restricted-globals': 'off',
        'import/no-unresolved': 'off',
      },
    },
    {
      files: 'examples/node/**/*',
      rules: { 'no-restricted-syntax': 'off' },
    },
    {
      files: ['tooling/**/*', 'examples/node/*', '**/*.config.js', '.eslintrc.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
  ],
};
