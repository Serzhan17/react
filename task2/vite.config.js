import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// IMPORTANT for GitHub Pages:
// Set `base` to "/<your-repo-name>/" (with leading and trailing slashes)
// e.g. if your repo is github.com/serzhan/about-me -> base: '/about-me/'
// If you deploy to a *user* page (username.github.io repo itself), use '/'.
export default defineConfig({
    plugins: [react()],
    base: '/react/',
});