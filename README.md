# Baqarah Tafsir Journal

A collaborative, offline-capable journal for studying *Tafsir* of Surah al-Baqarah.
Two people can take notes at the same time and stay in sync, and the app keeps
working when you lose connection.

The entire app is a **single self-contained file** — [`index.html`](./index.html).
There is no build step.

## How collaboration works

Live sync is powered by **Firebase Realtime Database** with **Firebase
Authentication** (email + password). The app loads the Firebase SDK (v10.12.2)
from Google's CDN at runtime — no Firebase keys are stored in this repository.

Each person **signs in with their own account**. Once signed in, your notes sync
automatically to every device where you sign in, and both people share the same
journal (both profiles, Abdalla & Fathia, are visible to collaborate). Because the
notebook is behind a login, the database can be **locked so only signed-in users
can read or write it** — your notes are no longer world-readable.

The app still works fully **offline / signed-out**: notes are saved locally and
sync turns on once you sign in.

### Setting up the Firebase backend (one-time, ≈ 5 min)

1. Create a free project at <https://console.firebase.google.com> → **Add project**
   (skip Analytics).
2. **Build → Realtime Database → Create Database** → pick a location.
3. **Build → Authentication → Get started** → enable the **Email/Password**
   provider.
4. Gear → **Project settings** → under *Your apps* click the **`</>`** (web) icon,
   register an app, and copy its **`apiKey`** and **`databaseURL`**
   (e.g. `https://your-project-default-rtdb.firebaseio.com`).
5. In **Realtime Database → Rules**, lock the database to signed-in users and
   publish:

   ```json
   {
     "rules": {
       ".read": "auth != null",
       ".write": "auth != null"
     }
   }
   ```

6. Open the app → the **Live sync** panel → paste the `databaseURL` and `apiKey`
   (stored once per device), then **Create account** / **Sign in**. Have your study
   partner do the same with their own email + password.

> **Tighter privacy (optional):** `auth != null` lets anyone who creates an account
> read the notebook. To restrict it to just the two of you, create both accounts
> first, find each user's **UID** in Authentication → Users, and change the rules to
> allow only those UIDs, e.g.
> `".read": "auth != null && (auth.uid === 'UID_1' || auth.uid === 'UID_2')"`
> (and the same for `".write"`).

> **Note:** A Firebase web `apiKey` is *not* a secret — it only identifies the
> project. Real access control comes from the security rules above.

> **Baking in the project (optional):** to skip the one-time `apiKey`/`databaseURL`
> entry entirely, set the `FIREBASE_CONFIG` constant near the top of the app's script
> to `{ apiKey: "…", databaseURL: "…" }` before deploying; then the only step is
> signing in.

## Offline use

The app stores your work locally and continues to function without a connection
(and without signing in). When you sign in and come back online, changes reconcile
with the shared notebook.

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

Once deployed, share the Netlify URL with your study partner. Each of you enters the
same Firebase project details once, then signs in with your own account — and you're
journaling together.

> **Google sign-in note:** if you later switch to Google sign-in, add your Netlify
> domain under Firebase → Authentication → Settings → **Authorized domains**.
