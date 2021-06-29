module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:jsx-a11y/recommended',
    'airbnb',
    'prettier',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['prettier'],
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      node: {
        moduleDirectory: ['node_modules', './'],
      },
    },
  },
  rules: {
    // Remove conflicting indent option
    'react/jsx-indent': 'off',
    // Allows files with the .js extension to use jsx
    'react/jsx-filename-extension': [1, { extensions: ['.js', '.jsx'] }],
    // Removes error of React not in scope
    'react/react-in-jsx-scope': 'off',
    // Remove requirement of react prop definitions
    'react/prop-types': 'off',
    // Allow component prop spreading
    'react/jsx-props-no-spreading': 'off',
    'consistent-return': ['error', { treatUndefinedAsUnspecified: false }],
    'prettier/prettier': 'error',
  },
};
