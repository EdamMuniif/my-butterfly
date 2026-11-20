import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// base './' keeps every asset path relative, so the site works on
// https://<user>.github.io/<any-repo-name>/ without editing this file.
export default defineConfig({
  base: './',
  build: {
    target: 'es2019',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: { main: r('./index.html'), qr: r('./qr.html') },
    },
  },
});
