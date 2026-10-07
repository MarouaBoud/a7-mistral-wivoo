// Type declarations for CSS modules
// This allows TypeScript to recognize CSS imports in TypeScript files
declare module '*.css' {
  const content: string;
  export default content;
}
