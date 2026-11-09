import adapter from '@sveltejs/adapter-vercel';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit({ adapter: adapter() })],
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'node',
		testTimeout: 20_000
	}
});
