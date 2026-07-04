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

The app opens on a **login screen**. Each person **signs in with their own
account** (or taps **Create account** to self-register — no manual user creation in
the Firebase console). Once signed in, your notes sync automatically to every device
where you sign in, and both people share the same journal (both profiles, Abdalla &
Fathia, are visible to collaborate). Because the notebook is behind a login, the
database can be **locked so only your accounts can read or write it** — your notes
are no longer world-readable.

You're never locked out: the login screen has a **"Continue offline on this device"**
link that opens your local notes without signing in (sync just stays off until you
sign in). The app is fully usable offline.

**Registration invite code:** account creation is gated by a shared invite code so
random people can't self-register through the app. Set it via the `INVITE_CODE`
constant near the top of the app's script (default `"baqarah-journal"` — change it,
and share it only with your study partner). Set it to `""` to allow open sign-up.

### Setting up the Firebase backend (one-time, ≈ 5 min)

1. Create a free project at <https://console.firebase.google.com> → **Add project**
   (skip Analytics).
2. **Build → Realtime Database → Create Database** → pick a location.
3. **Build → Authentication → Get started** → enable the **Email/Password**
   provider.
4. Gear → **Project settings** → under *Your apps* click the **`</>`** (web) icon,
   register an app, and copy its **`apiKey`** and **`databaseURL`**
   (e.g. `https://your-project-default-rtdb.firebaseio.com`).
5. In **Realtime Database → Rules**, lock the database to **your two emails**
   (recommended — you know these up front, so there's nothing to create or look up
   first), and publish:

   ```json
   {
     "rules": {
       ".read":  "auth != null && (auth.token.email === 'abdalla@example.com' || auth.token.email === 'fathia@example.com')",
       ".write": "auth != null && (auth.token.email === 'abdalla@example.com' || auth.token.email === 'fathia@example.com')"
     }
   }
   ```

6. Open the app → on the login screen, paste the `databaseURL` and `apiKey` once
   (stored per device), then **Create account** / **Sign in**. Have your study
   partner do the same with their own email + password.

> **Why not `auth != null`?** That rule lets *anyone* who creates an account read
> the notebook, and Firebase flags it as insecure. The email allowlist above
> restricts access to just the two of you (a stranger can register but gets
> permission-denied). If you prefer UIDs over emails, create both accounts first,
> copy each **UID** from Authentication → Users, and use
> `"auth != null && (auth.uid === 'UID_1' || auth.uid === 'UID_2')"` instead.

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
