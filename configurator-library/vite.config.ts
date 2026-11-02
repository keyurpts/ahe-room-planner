import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      // The entry point for your library when you import it This is the main file of your library
      entry: resolve(__dirname, 'src/index.ts'),
      // The name of your library
      name: 'ThreeConfigurator',
      // Output file formats this tells Vite to generate multiple formats for the library
      // 'es' for ES modules, 'cjs' for CommonJS, and 'umd' for Universal Module Definition
      formats: ['es', 'cjs','umd'],
      // Generated file names
      fileName: (format) => `three-configurator.${format}.js`,
    },
    rollupOptions: {
      // Make sure to externalize dependencies that shouldn't be bundled
      //here we are excluding three.js from the bundle so we are not forcing the user to use a specific version of three.js
      // This is important for libraries that depend on three.js, as it allows the user to use their own version of three.js
      external: ['three'],
      output: {
        // Global variables to use in UMD build for externalized deps
        globals: {
          three: 'THREE',
        },
      },
    },
    // Generate sourcemaps for better debugging
    sourcemap: true,
    // Clean the output directory before building
    emptyOutDir: true,
  },
});
