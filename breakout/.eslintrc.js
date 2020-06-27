// prettier-ignore
module.exports = {
  env: {'es6': true},
  plugins: ['react', 'import'],
  extends: ['prettier', 'prettier/react', 'plugin:import/errors'],
  rules: {
    'guard-for-in': 0,
    'no-inline-comments': 0,
    camelcase: 0,
    'react/forbid-prop-types': 0,
    'react/no-deprecated': 0,
    'newline-per-chained-call': ["error", { "ignoreChainWithDepth": 2 }]
  },
  parserOptions: {
    ecmaVersion: 2019,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
};
