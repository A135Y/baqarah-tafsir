# Baqarah Tafsir Journal

A personal, offline-capable journal for studying *Tafsir* of Surah al-Baqarah.
Each person gets their own **private** notebook that syncs across their devices, and
the app keeps working when you lose connection.

The entire app is a **single self-contained file** — [`index.html`](./index.html).
There is no build step.

## How accounts & sync work

Live sync is powered by **Firebase Realtime Database** with **Firebase
Authentication** (email + password). The app loads the Firebase SDK (v10.12.2)
from Google's CDN at runtime — no Firebase keys are stored in this repository.

The app opens on a **login screen**. Anyone can **Create account** (open,
self-service registration — no manual user creation in the Firebase console) or
**Sign in**. After signing in the first time, you **pick your name** (e.g. Abdalla or
Fathia) to **claim** that notebook — the first account to claim a name keeps it, and
its existing notes become yours; the other name stays for your study partner. There's
no profile switcher: you just see your own name.

Each account has its **own completely private notebook**: your notes are stored under
your user ID (`users/<your-uid>/…`) and, with the security rules below, **only you can
read or write them**. Names are reserved in a small `claims` registry so two people
can't grab the same one. Signing in on another device brings your own notebook with
you; nobody else can see it.

You're never locked out: the login screen has a **"Continue offline on this device"**
link that opens your local notes without signing in (sync just stays off until you
sign in). The app is fully usable offline.

> **Optional — gate registration:** if you'd rather not allow fully open sign-up,
> set the `INVITE_CODE` constant near the top of the app's script to a shared code;
> the Create-account screen will then require it. It ships as `""` (open).

### Setting up the Firebase backend (one-time, ≈ 5 min)

1. Create a free project at <https://console.firebase.google.com> → **Add project**
   (skip Analytics).
2. **Build → Realtime Database → Create Database** → pick a location.
3. **Build → Authentication → Get started** → enable the **Email/Password**
   provider.
4. Gear → **Project settings** → under *Your apps* click the **`</>`** (web) icon,
   register an app, and copy its **`apiKey`** and **`databaseURL`**
   (e.g. `https://your-project-default-rtdb.firebaseio.com`).
5. In **Realtime Database → Rules**, scope each account to its own private data and
   publish. This is the correct, secure rule for per-user notebooks — open
   registration is safe because each user can only ever touch their own subtree:

   ```json
   {
     "rules": {
       "claims": {
         "$name": {
           ".read":  "auth != null",
           ".write": "auth != null && (!data.exists() || data.val() === auth.uid)"
         }
       },
       "users": {
         "$uid": {
           ".read":  "auth != null && auth.uid === $uid",
           ".write": "auth != null && auth.uid === $uid"
         }
       }
     }
   }
   ```

6. Open the app → on the login screen, paste the `databaseURL` and `apiKey` once
   (stored per device), then **Create account** or **Sign in**, and pick your name to
   claim your notebook. Anyone you share the link with can do the same and gets their
   own private notebook.

> **Why this is secure:** every account's data lives under `users/<uid>`, and the
> rule only lets a signed-in user read/write the subtree matching **their own** UID —
> a stranger can register but can only ever see their own (empty) notebook, never
> yours. The `claims` rule lets each name be written **only while unclaimed** (or by
> its current owner), so a name can't be stolen once taken. This also clears
> Firebase's "not secure" warning.

> **Note:** A Firebase web `apiKey` is *not* a secret — it only identifies the
> project. Real access control comes from the security rules above.

> **Baking in the project (optional):** to skip the one-time `apiKey`/`databaseURL`
> entry entirely, set the `FIREBASE_CONFIG` constant near the top of the app's script
> to `{ apiKey: "…", databaseURL: "…" }` before deploying; then the only step is
> signing in.

## Offline use

The app stores your work locally and continues to function without a connection
(and without signing in). When you sign in and come back online, changes reconcile
with your own private notebook in the cloud.

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
