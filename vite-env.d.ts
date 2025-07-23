/// <reference types="vite/client" />
// In packages/tourbuilder-react/src/vite-env.d.ts

declare module '*?raw' {
  const content: string;
  export default content;
}