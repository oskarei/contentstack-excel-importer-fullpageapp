# Excel Importer — Contentstack fullpage app

React + Vite app that parses an Excel file (columns **title**, **text**, **description**) and creates draft entries in the **`susanna`** content type using the Contentstack App SDK, Venus components, and the Management SDK (via the marketplace adapter).

---

## Prerequisites

- **Node.js** 18+ and **npm** (Venus currently declares support up to Node 22; newer Node versions may show engine warnings but usually work).
- A Contentstack account with permission to use **Developer Hub** and install apps on a stack.
- **Optional:** access to **Contentstack Launch** in your organization if you want hosted deployments.

---

## Run locally

### 1. Install dependencies

```bash
cd excelImporter
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

By default Vite listens on **port 4322** and binds to all interfaces (`host: true`), so you can open:

- Root / fallback: [http://localhost:4322/](http://localhost:4322/)
- **Fullpage app (the location you register in Developer Hub):** [http://localhost:4322/excel-importer](http://localhost:4322/excel-importer)
- **OAuth callback (redirect URI):** [http://localhost:4322/oauth/callback](http://localhost:4322/oauth/callback)

### 3. Expose localhost to Contentstack (required for real testing)

Contentstack loads your app in the product UI from a URL it can reach. Plain `localhost` is not reachable from Contentstack’s servers, so you need a **public HTTPS URL** that tunnels to your machine.

Typical options:

- **Contentstack CLI** (if you use app development workflows):  
  `contentstack app:serve` — follow the CLI docs for your version so the tunnel URL matches what you paste into Developer Hub.
- **Another HTTPS tunnel** (ngrok, Cloudflare Tunnel, etc.): point it at `http://localhost:4322` and use the generated origin in Developer Hub (see below).

Whenever your tunnel URL changes, update the app’s **Hosting URL** / location URLs and **OAuth redirect URIs** in Developer Hub.

### 4. Production-like build on your machine

```bash
npm run build
npm run preview
```

Preview serves the contents of `dist/` (default Vite output). Use this to verify the built assets before deploying.

---

## Install and configure the app in Developer Hub

These steps assume you already have a **public base URL** for your app (tunnel in development, Launch or another host in production). Call that origin `https://your-app.example.com` below.

### 1. Create the app

1. Log in to Contentstack and open **Developer Hub**.
2. Create a **new app** (or open an existing one you use for this project).
3. Set the app’s **hosting / development URL** to your public origin, e.g. `https://your-app.example.com` (no trailing path required if your locations use absolute paths).

### 2. Add the Fullpage location

1. Open your app → **UI Locations** (or equivalent).
2. Add a **Fullpage** location.
3. Set the path or URL so it loads the importer UI, for example:
   - If the hosting root is your Vite app:  
     **`https://your-app.example.com/excel-importer`**
4. Save.

The app’s router only mounts the SDK-powered UI when the path contains **`/excel-importer`** (see `src/containers/App/App.tsx`).

### 3. OAuth (optional but common)

If you use OAuth for this app:

1. Open the app’s **OAuth** settings in Developer Hub.
2. Add **Redirect / callback URL(s)** that match your deployment, for example:
   - Development: `https://<your-tunnel-host>/oauth/callback`
   - Production: `https://your-app.example.com/oauth/callback`
3. Select the scopes your app needs (at minimum, align with what you do in code; entry creation here relies primarily on **App Permissions** — see next section).

The repo includes a small **`/oauth/callback`** page that posts a message to `window.opener` and closes the window, consistent with common Contentstack app patterns.

### 4. App Permissions (required for importing entries)

Entry creation uses `@contentstack/management` with `sdk.createAdapter()`, which depends on **App Permissions**, not only OAuth.

1. In Developer Hub, open your app → **UI Locations**.
2. Scroll to the bottom to **App Permissions** (it is easy to miss).
3. Enable at least:
   - **`content_types:read`**
   - **`entries:write`**
4. **Save** the app configuration.
5. **Reinstall** the app on the target stack (or update the installation). Permissions often do not apply until after reinstall.
6. If you still see **403** errors when importing, wait a few minutes and confirm the app instance on the stack is the latest.

### 5. Install the app on a stack

1. In Contentstack, go to **Settings → Apps** (or your org’s app installation flow).
2. Install your app and complete any OAuth consent screen if configured.
3. Open the app from the stack (Fullpage entry point). You should land on `/excel-importer` as configured.

### 6. Content type and Excel format

- Content type UID: **`susanna`** (hardcoded in `src/containers/FullPageApp/FullPageApp.tsx`).
- Fields: **`title`**, **`text`**, **`description`** (plain text), matching the Excel header row (case-insensitive).
- First worksheet only; first row = headers; following rows = data. Empty rows are skipped.

---

## Deploy to Contentstack Launch (optional)

[Contentstack Launch](https://www.contentstack.com/docs/launch) can host the **static build** of this Vite app. Official overview: [Other frameworks on Launch](https://www.contentstack.com/docs/developers/launch/other-frameworks-on-launch).

This project is a **client-side SPA**: `npm run build` emits static files into **`dist/`**. You do **not** need a Node server command on Launch for production hosting.

### Option A — Build on Launch (Git repository)

1. Push this project to a Git repository Launch can access.
2. In Contentstack, open **Launch** → **+ New Project**.
3. Choose **Import from a Git Repository** and select the repo/branch.
4. Under **Build and Output Settings**, use the **Other** (or SSG-style) preset and set:
   - **Install command** (if shown): `npm ci` or `npm install`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
5. Leave **Server command** empty if Launch treats the project as static-only (see Launch UI; static hosting skips a long-running server).
6. Deploy and wait for the build to finish.
7. Note the **Launch URL** (e.g. `https://<project>.contentstackapps.com` or your custom domain).

Then in **Developer Hub**, set your app’s production URLs to that origin:

- Fullpage: `https://<launch-host>/excel-importer`
- OAuth callback: `https://<launch-host>/oauth/callback`

### Option B — Pre-built artifact (no build on Launch)

If you prefer Launch to **only host files** (no install/build on their builders):

1. Locally run `npm ci && npm run build`.
2. Zip the **`dist`** folder contents (or the whole `dist` folder per Launch’s upload rules).
3. In Launch, create a project via **Upload a file** and follow [upload instructions](https://www.contentstack.com/docs/developers/launch/import-project-using-file-upload/).
4. In **Build and Output Settings**, **leave the build command blank** so Launch treats the project as a pre-built static site (see [Host a static site](https://www.contentstack.com/docs/developers/launch/host-a-static-site)).

Again, point Developer Hub at `https://<launch-host>/excel-importer` and `/oauth/callback`.

### SPA routing note

Routing is path-based (`/excel-importer`, `/oauth/callback`). If users open a **deep link** directly and your host returns 404 for unknown paths, configure the host (Launch or CDN) to **fallback to `index.html`** for client-side routes. Many static hosts call this “SPA redirect” or “custom error document.” If you only ever open the app from Contentstack’s iframe using the exact Fullpage URL, you may not hit this issue.

### Base path (subdirectory deploys)

If Launch serves the site under a subpath (uncommon), set Vite’s `base` in `vite.config.ts` to that path and rebuild so asset URLs resolve correctly.

### Node version on Launch

Launch’s build image supports specific Node versions. If builds fail, check [Supported Node.js versions for Launch](https://www.contentstack.com/docs/developers/launch/supported-nodejs-versions) and align your project or Launch settings.

---

## Scripts reference

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `npm run dev`     | Vite dev server (default port **4322**)          |
| `npm run build`   | Typecheck (`tsc`) + production bundle → `dist/`  |
| `npm run preview` | Serve `dist/` locally for smoke tests            |

---

## Troubleshooting

| Issue | What to check |
| ----- | ------------- |
| Blank app or SDK never ready | Public HTTPS URL, correct Fullpage path `/excel-importer`, no mixed content (HTTPS app URL). |
| **403** on import | App Permissions (`entries:write`, `content_types:read`), **reinstall** app on stack. |
| OAuth window / token issues | Redirect URI exactly matches Developer Hub; user completed install consent. |
| Import errors per row | Field UIDs on `susanna` match `title`, `text`, `description`; mandatory field rules in Contentstack. |

For more on apps and the Management SDK adapter, see Contentstack’s documentation for **marketplace apps** and **App Permissions**.
