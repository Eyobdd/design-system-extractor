const baseConfig = require('./base.js');
const globals = require('globals');

module.exports = [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
