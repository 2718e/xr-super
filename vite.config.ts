import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Static web app - builds to plain HTML/JS/CSS deployable on Vercel/Netlify
// or anywhere static files can be served, and runs locally via `npm run dev`.
export default defineConfig({
  plugins: [react()],
  base: './',
});
