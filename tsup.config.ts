import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  // This is the crucial part:
  // Update this to use the new, scoped package name.
  external: ['react', 'react-dom', '@multimediafabrik/tourbuilder'],
  
  inject: ['./src/react-shim.js'],
})
