import js from '@eslint/js';
import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';

/**
 * Dependency rule (Clean Architecture): source code dependencies only point inwards.
 *   ui  ->  application  ->  domain
 *   adapters -> ports (+ domain types)
 * The domain knows nothing about the outside world.
 */
const forbid = (...layers) => ({
  'no-restricted-imports': ['error', {
    patterns: layers.map((l) => ({ group: [`**/${l}/**`, `**/${l}`], message: `Dependency rule: this layer must not depend on "${l}".` })),
  }],
});

export default ts.config(
  { ignores: ['dist', 'node_modules', 'android', 'ios'] },
  js.configs.recommended,
  ...ts.configs.strict,
  ...svelte.configs['flat/recommended'],
  {
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      'max-lines-per-function': ['warn', { max: 40, skipBlankLines: true, skipComments: true }],
      'max-params': ['warn', 4],
      complexity: ['warn', 10],
    },
  },
  { files: ['**/*.svelte'], languageOptions: { parserOptions: { parser: ts.parser } } },
  { files: ['**/*.svelte.ts'], languageOptions: { parser: ts.parser } },
  { files: ['src/domain/**'], rules: forbid('application', 'ports', 'adapters', 'ui') },
  { files: ['src/application/**'], rules: forbid('adapters', 'ui') },
  { files: ['src/ports/**'], rules: forbid('application', 'adapters', 'ui') },
  { files: ['src/adapters/**'], rules: forbid('application', 'ui') },
  { files: ['tests/**'], rules: { 'max-lines-per-function': 'off' } },
);
