/**
 * The entry point imports the theme's stylesheet for its side effect, which is how Vite
 * collects it into `dist/style.css`. TypeScript has no idea what a `.css` file is and
 * refuses a side-effect import of one without this.
 */
declare module '*.css';
