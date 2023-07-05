module.exports = {
  overrides: [
    {
      files: ['*.js', '*.jsx', '*.ts', '*.tsx'],
      extends: 'standard-with-typescript',
      parserOptions: {
        project: './tsconfig.json'
      },
      rules: {
        '@typescript-eslint/space-before-function-paren': ['error', {
          anonymous: 'never',
          named: 'never',
          asyncArrow: 'always'
        }],
        '@typescript-eslint/explicit-function-return-type': 0,
        '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: 'h' }]
      }
    }
  ]
}
