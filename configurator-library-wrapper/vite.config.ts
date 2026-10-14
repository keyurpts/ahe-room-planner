import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  build: {
    lib: {
      entry: { index: fileURLToPath(new URL('./src/index.ts', import.meta.url)), units: fileURLToPath(new URL('./src/units.ts', import.meta.url)) },
      formats: ['es'],
      fileName: (_format, name) => name + '.js',
    },
    rollupOptions: { external: ['three-configurator'] },
    sourcemap: true,
  },
});
