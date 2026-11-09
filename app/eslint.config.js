import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import ts from 'typescript-eslint';

export default ts.config(
	{ ignores: ['.svelte-kit/', '.vercel/', 'build/', 'drizzle/', '.data/'] },
	js.configs.recommended,
	...ts.configs.strictTypeChecked,
	...svelte.configs.recommended,
	prettier,
	...svelte.configs.prettier,
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.svelte']
			}
		},
		rules: {
			'@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }]
		}
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts'],
		languageOptions: { parserOptions: { parser: ts.parser } }
	},
	{
		files: ['eslint.config.js'],
		...ts.configs.disableTypeChecked
	}
);
