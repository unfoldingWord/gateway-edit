module.exports = {
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    requireConfigFile: false,
    babelOptions: {
      presets: ['@babel/preset-react']
    }
  },
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  rules: {
    'no-undef': 'error',
    // Disable all other rules
    'import/no-unresolved': 'off',
    'import/order': 'off',
    'semi': 'off',
    'padding-line-between-statements': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'comma-dangle': 'off',
    'no-unused-vars': 'off'
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@components', './src/components'],
          ['@context', './src/context'],
          ['@hooks', './src/hooks'],
          ['@styles', './src/styles'],
          ['@common', './src/common'],
          ['@utils', './src/utils']
        ],
        extensions: ['.js', '.jsx', '.json']
      }
    }
  }
}
