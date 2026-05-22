import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/application/handler/lambda-handler.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
});
