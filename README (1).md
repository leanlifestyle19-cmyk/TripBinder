# ✈️ Wayfarer

> Your personal offline-first travel binder — plan, store, and access your entire trip without an internet connection.

---

## What it is

Wayfarer is a PWA (Progressive Web App) travel itinerary organiser. Everything lives on your device — no accounts, no servers, no subscriptions. After the first load it works fully offline. Install it to your phone home screen and it behaves like a native app.

**Key features:**
- Multiple trips, multi-city (e.g. Malaysia: KL → Redang)
- Item types: Flight, Hotel, Activity, Transport, Meal, Other
- Attach PDFs and images to any item (stored offline as base64)
- Timeline and Calendar views
- Pre-departure checklist per trip
- Export/import trips as JSON (manual "cloud sync" via Drive or iCloud)
- Share itinerary as plain text
- 30-minute push notification reminders
- Map pins via Leaflet + OpenStreetMap (no API key needed)
- Dark mode, ocean palette, installable on iOS and Android

---

## Files

```
wayfarer/
├── index.html      ← Entire app (HTML + CSS + JS, single file)
├── manifest.json   ← PWA identity (name, icons, theme)
├── sw.js           ← Service worker (offline cache + push notifications)
└── README.md       ← This file
```

No build step. No dependencies to install. Pure static files.

---

## Deploy to GitHub Pages (recommended, free)

### Step 1 — Create a repository

1. Go to [github.com](https://github.com) and sign in (create a free account if needed).
2. Click **New repository**.
3. Name it `wayfarer` (or anything you like).
4. Set it to **Public**.
5. Click **Create repository**.

### Step 2 — Upload the files

**Option A — via the GitHub web interface (no Git needed):**

1. In your new repository, click **Add file → Upload files**.
2. Drag and drop all 4 files: `index.html`, `manifest.json`, `sw.js`, `README.md`.
3. Click **Commit changes**.

**Option B — via Git on your computer:**

```bash
git clone https://github.com/YOUR_USERNAME/wayfarer.git
cd wayfarer
# Copy your 4 files into this folder, then:
git add .
git commit -m "Initial Wayfarer deploy"
git push origin main
```

### Step 3 — Enable GitHub Pages

1. In your repository, click **Settings** (top tab).
2. In the left sidebar, click **Pages**.
3. Under **Source**, select **Deploy from a branch**.
4. Set branch to `main`, folder to `/ (root)`.
5. Click **Save**.

### Step 4 — Visit your app

After ~1 minute, your app will be live at:

```
https://YOUR_USERNAME.github.io/wayfarer/
```

GitHub Pages serves over HTTPS, which is required for:
- Service workers (offline mode)
- Web Notifications
- Installing as a PWA

---

## Deploy to Vercel (alternative, also free)

### Step 1 — Install Vercel CLI (optional)

```bash
npm install -g vercel
```

### Step 2 — Deploy

**Option A — via CLI:**

```bash
cd wayfarer   # folder containing your 4 files
vercel
```

Follow the prompts. Vercel will detect a static site automatically.

**Option B — via the Vercel dashboard (no CLI):**

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New → Project**.
3. Import your `wayfarer` GitHub repository.
4. Leave all settings as default (Vercel auto-detects static files).
5. Click **Deploy**.

Your app will be live at `https://wayfarer-YOUR_NAME.vercel.app` within seconds.

---

## Deploy to Netlify (alternative, also free)

1. Go to [app.netlify.com](https://app.netlify.com).
2. Drag and drop your `wayfarer` **folder** onto the Netlify deploy zone.
3. Done — live immediately at a `*.netlify.app` URL.

For a custom domain or auto-deploys from GitHub, connect the repo under **Site settings → Build & deploy**.

---

## Install to your phone

### Android (Chrome)

1. Open your deployed URL in Chrome.
2. Tap the **⋮ menu → Add to Home screen**.
3. Tap **Add**.

Wayfarer will appear on your home screen as a standalone app with no browser chrome.

### iOS (Safari)

1. Open your deployed URL in **Safari** (must be Safari for PWA install on iOS).
2. Tap the **Share button** (box with arrow pointing up).
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add**.

> **Note:** iOS requires Safari for PWA installation. Chrome on iOS will not show the Add to Home Screen prompt.

---

## Backup & sync between devices

Wayfarer has no server. To move your data between devices:

1. Open **Settings** in Wayfarer.
2. Find the trip you want to transfer and tap **Export**.
3. Save the `.json` file to Google Drive, iCloud, or share it directly.
4. On the other device, open Wayfarer → **Settings → Import Trip**.
5. Select the `.json` file.

All attachments (PDFs and images) are embedded in the JSON export as base64, so the file is fully self-contained.

---

## Notifications

Wayfarer uses the Web Notifications API to fire reminders 30 minutes before each item on today's schedule.

To enable:
1. Open **Settings → Reminders**.
2. Tap the toggle — your browser will ask for permission.
3. Grant permission.

Reminders are scheduled using `setTimeout` when the app loads, so the app must be open (or in background as a PWA) to receive them. True background push requires a push server; see below if you want to add that later.

### Optional: true background push (advanced)

If you want notifications even when the app is closed, you need a push server that sends Web Push payloads to the service worker. The service worker (`sw.js`) already handles `push` events — you just need to send them. Services like [web-push](https://www.npmjs.com/package/web-push) (Node.js) or [ntfy.sh](https://ntfy.sh) can handle this.

---

## Local development

No build tools needed. Just serve the files over HTTP (required for service workers — `file://` won't work):

```bash
# Python 3
python3 -m http.server 8080

# Node.js (npx, no install)
npx serve .

# VS Code
# Install the "Live Server" extension, right-click index.html → Open with Live Server
```

Then open `http://localhost:8080` in your browser.

---

## Data & privacy

- All data is stored in **IndexedDB** in your browser.
- Nothing is ever sent to any server.
- Attachments (PDFs, images) are stored as base64 strings inside IndexedDB.
- Clearing your browser data / app storage will erase all trips. **Export regularly.**

---

## Browser support

| Browser | PWA Install | Offline | Notifications |
|---|---|---|---|
| Chrome (Android) | ✅ | ✅ | ✅ |
| Safari (iOS 16.4+) | ✅ | ✅ | ✅ |
| Chrome (Desktop) | ✅ | ✅ | ✅ |
| Firefox | ❌ (no install) | ✅ | ✅ |
| Samsung Internet | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |

---

## Customisation

All design tokens (colours, fonts, spacing) are CSS variables at the top of `index.html` inside `:root { ... }` and `[data-theme="dark"] { ... }`. Change them to retheme the entire app instantly.

The demo trip (Malaysia: KL & Redang) is seeded on first launch if no trips exist. To remove it, delete the `seedDemoData()` call in the `init()` function at the bottom of `index.html`.

---

## Licence

MIT — use it however you like.
