import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      // Library entry point file
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Wrapper',
      // Generate ES module, CommonJS, and UMD formats
      formats: ['es', 'cjs', 'umd'],
      // Output file naming pattern in dist/
      fileName: (format) => `wrapper.${format}.js`,
    },
    rollupOptions: {
      // Do not bundle peer dependencies consumer apps provide them
      external: ['three', 'three-configurator'],
      output: {
        // Global variable mapping for external dependencies in UMD mode
        globals: {
          three: 'THREE',
          'three-configurator': 'ThreeConfigurator',
        },
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
