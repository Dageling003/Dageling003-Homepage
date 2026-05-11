import js from '@eslint/js';
import pluginVue from 'eslint-plugin-vue';
import prettier from 'eslint-config-prettier';
import pluginPrettier from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    ignores: ['node_modules/**', 'dist/**', '.vscode/**', 'public/**'],
  },
  {
    files: ['**/*.{js,vue}'],
    plugins: {
      prettier: pluginPrettier,
    },
    rules: {
      'prettier/prettier': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/attributes-order': 'warn',
      'vue/require-default-prop': 'warn',
      'no-console': 'warn',
      'no-undef': 'error',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
  prettier,
];
