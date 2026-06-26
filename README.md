# Baqarah Tafsir Journal

A collaborative, offline-capable journal for studying *Tafsir* of Surah al-Baqarah.
Two people can take notes at the same time and stay in sync, and the app keeps
working when you lose connection.

The entire app is a **single self-contained file** — [`index.html`](./index.html).
There is no build step.

## How collaboration works

Live sync is powered by **Firebase Realtime Database**. The app loads the Firebase
SDK (v10.12.2) from Google's CDN at runtime — so no Firebase keys are stored in
this repository. Instead, each person enters the connection details inside the app
the first time they open it:

1. **API key** — your Firebase project's web `apiKey`.
2. **Database URL** — your Firebase `databaseURL`
   (e.g. `https://your-project-default-rtdb.firebaseio.com`).
3. **Room code** — any shared word/phrase you both agree on (e.g. `baqarah-2026`).
   Everyone using the **same room code** sees the same shared journal.

These values are saved in the browser's `localStorage`, so you only enter them once
per device.

### Setting up the Firebase backend (one-time)

1. Create a free project at <https://console.firebase.google.com>.
2. Add a **Web app** to the project and copy its `apiKey` and `databaseURL`.
3. Enable **Realtime Database** (Build → Realtime Database → Create database).
4. Share the `apiKey`, `databaseURL`, and an agreed **room code** with your study partner.

> **Security note:** A Firebase web `apiKey` is *not* a secret — it only identifies
> the project. Access is controlled by your **Realtime Database security rules**.
> Lock those rules down (e.g. require authentication, or restrict to your room paths)
> before relying on this for anything private.

## Offline use

The app stores your work locally and continues to function without a connection.
When you come back online, changes reconcile with the shared room.

## Hosting on Netlify

This repo is Netlify-ready (`netlify.toml` publishes the root, no build needed).

**Option A — Connect this Git repo (auto-deploys on every push):**
1. Go to <https://app.netlify.com> → **Add new site → Import an existing project**.
2. Pick this repository.
3. Leave the build command empty and set the publish directory to `.` (the
   `netlify.toml` already does this). Deploy.

**Option B — Drag-and-drop (fastest, no Git):**
1. Go to <https://app.netlify.com/drop>.
2. Drag `index.html` onto the page. It goes live in seconds.

Once deployed, share the Netlify URL with your study partner, have you both enter the
same Firebase details + room code, and you're journaling together.
