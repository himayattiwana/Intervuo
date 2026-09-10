# Deploying to Vercel

This app is a standard Vite + React project (`npm run build` outputs to `dist/`).
Vercel auto-detects Vite projects, but a minimal `vercel.json` has been added at
the repo root to guarantee SPA client-side routing works (all paths fall back to
`index.html`). This does not touch or affect the existing Netlify deployment.

## Environment variables

Set the following in the Vercel project's **Settings → Environment Variables**
(for Production, Preview, and Development as needed):

- `VITE_API_BASE_URL` — same value currently set on Netlify:
  `https://intervuo-backend-exrg.onrender.com`

  (This repo's frontend falls back to `http://localhost:5000` if the variable
  is unset, so it will break in production without this set.)

## First-time import steps (Vercel dashboard)

1. Go to https://vercel.com/new and import this Git repository.
2. Framework Preset: **Vite** (should auto-detect; verify it's not left as "Other").
3. Root Directory: repo root (the one containing `package.json`, `vite.config.js`
   — do **not** point it at `Smart_Resume_Analyser_App-master/`, which is the
   Flask backend and is not deployed to Vercel).
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Add the environment variable from above (`VITE_API_BASE_URL`).
7. Click Deploy.
8. Once the build finishes, Vercel assigns a domain like
   `your-project.vercel.app`. Visit it and confirm the app loads and can reach
   the backend (check network requests / login or resume upload flow).

## Status: done

Live at `https://intervuo1.vercel.app` (also aliased as
`https://intervuo-virid.vercel.app`; `intervuo.vercel.app` was already taken
by another Vercel account). `netlify.toml` now 301-redirects
`https://intervuo.netlify.app` to `https://intervuo1.vercel.app`, so old
links keep working — Vercel is the real site going forward.
