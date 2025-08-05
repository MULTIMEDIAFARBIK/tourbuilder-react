import { defineConfig } from 'tsup'
import fs from 'fs'
import path from 'path'


const wrapperCode = fs.readFileSync(
  path.resolve(__dirname, '../tourbuilder/dist/index.iife.js'),
  'utf-8'
);

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['cjs', 'esm'],
  dts: true, // We can keep this true now!
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom'],

  // This will replace the placeholder variables in your code with the actual file content.
esbuildOptions(options) {
    options.define = {
      ...options.define,
      // The JSON.stringify is crucial to ensure the content is treated as a string literal.
      '__WRAPPER_CODE__': JSON.stringify(wrapperCode),
    }
    return options
  },
})