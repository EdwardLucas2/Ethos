// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const tanstackQuery = require('@tanstack/eslint-plugin-query');

module.exports = defineConfig([
    expoConfig,
    ...tanstackQuery.configs['flat/recommended-strict'],
    prettierConfig,
    {
        ignores: ['dist/*', 'src/api/*'],
    },
]);
