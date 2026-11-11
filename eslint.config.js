// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/**', 'preview/**', 'node_modules/**', 'docs/**'],
  },
  {
    rules: {
      // Reanimated shared values are mutable by design — `shared.value = withSpring(…)`
      // inside event handlers and worklets is the documented API. The React Compiler
      // lint rules cannot see through it, so they are turned off for this codebase.
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // RN style props are frequently inline objects; extracting them hurts readability.
      'react-native/no-inline-styles': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]);
