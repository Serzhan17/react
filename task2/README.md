# Serzhan — About Me

A self-promotional React SPA. Five components: `App`, `ProfileHero`,
`Avatar`, `AboutMe`, `Interests`, `Contact` — well over the "at least 3"
requirement.

## Run it locally

```bash
npm install
npm run dev
```

Open the local URL it prints (usually `http://localhost:5173`).

## Before you deploy — 3 things to edit

1. **`vite.config.js`** — change `base: '/REPLACE_WITH_YOUR_REPO_NAME/'`
   to match your actual GitHub repo name, e.g. `base: '/about-me/'`.
   (If you're deploying to a *user* page — a repo literally named
   `your-username.github.io` — use `base: '/'` instead.)
2. **`src/components/Contact.jsx`** — swap the GitHub placeholder for
   your real profile link (or swap it for Instagram, or anything else
   safe/public). The email is already filled in.
3. **A real photo (optional)** — drop an image file into `public/`
   (e.g. `public/photo.jpg`) and replace the `<svg>` block in
   `src/components/Avatar.jsx` with:
   ```jsx
   <img src="/photo.jpg" alt="Serzhan" className="avatar__photo" />
   ```
   Otherwise the SVG monogram badge works fine as your "any image".

## Deploy to GitHub Pages

**Option A — the `gh-pages` package (simplest):**

```bash
git init
git add .
git commit -m "Self-promo SPA"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main

npm run deploy
```

`npm run deploy` builds the app and pushes `dist/` to a `gh-pages`
branch. Then in your repo on GitHub: **Settings → Pages → Source →
Deploy from a branch → `gh-pages` / `root`**. Your site will be live at:

```
https://<your-username>.github.io/<your-repo>/
```

**Option B — GitHub Actions:** if you'd rather auto-deploy on every
push to `main`, GitHub's official Pages docs have a ready-made Vite
workflow — search "Vite GitHub Pages Actions" in their docs and drop
the workflow file into `.github/workflows/`.

## For your submission

- GitHub repository link — the repo you pushed to above
- Deployed application link — the `github.io` URL from Pages settings
- Screenshot — run `npm run dev`, open it in a browser, and take one
