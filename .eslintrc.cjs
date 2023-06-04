module.exports = {
    plugins: ['prettier', 'import'],
    root: true,
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended'
    ],
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: __dirname,
      warnOnUnsupportedTypeScriptVersion: false,
    },
    ignorePatterns: ['/*.*'],
    rules: {
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'crlf',
        },
      ],
      'no-underscore-dangle': 0,
      'no-param-reassign': 0,
      'no-restricted-syntax': 0,
      'no-plusplus': 0,
      'class-methods-use-this': 0,
      '@typescript-eslint/no-unused-vars': 0,
      'import/no-extraneous-dependencies': [
        'error',
        { devDependencies: ['**/*.test.ts', '**/TestUtils.ts'] },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'variable',
          format: ['camelCase'],
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'variable',
          modifiers: ['global', 'const'],
          types: ['boolean', 'number', 'string', 'array'],
          format: ['UPPER_CASE'],
        },
        {
          selector: 'memberLike',
          modifiers: ['private'],
          format: ['camelCase'],
          leadingUnderscore: 'require',
        },
      ],
    },
  };
  