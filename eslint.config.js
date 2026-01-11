const baseConfig = require('@extracted/eslint-config/node');

module.exports = [
  ...baseConfig,
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.next/**'],
  },
];
