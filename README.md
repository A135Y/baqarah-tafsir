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

The app opens on a **login screen**. When you **Create account** you enter your
**first name**. If it matches a seeded notebook (**Abdalla** or **Fathia**) you claim
that notebook and its existing notes become yours; the first account to register with
a name keeps it. **Any other first name creates a fresh, empty private notebook** for
that person. Your name is saved to your account, so **signing in again restores your
notebook automatically** — no re-picking, no profile switcher; you just see your own
name. (Offline, an opaque "type your name" prompt opens an existing on-device notebook
without revealing any names.)

Each account has its **own completely private notebook**: your notes are stored under
your user ID (`users/<your-uid>/…`) and, with the security rules below, **only you can
read or write them**. Names are reserved in a small `claims` registry so two people
can't grab the same one. Signing in on another device brings your own notebook with
you; nobody else can see it.

### Account safety & recovery

- **Change password** — in the account panel (the sync/status dialog), a signed-in user
  can set a new password without deleting the account, so the notebook and reserved name
  are preserved.
- **Forgot password** — the sign-in screen has a **"Forgot password?"** link. Enter your
  email and Firebase sends a reset link; open it, choose a new password, then sign in.
- **Show / hide password** — every password field has a **Show/Hide** toggle so you can
  check what you typed before submitting.
- **Backup & Import** — the sidebar has **Backup** (downloads your whole notebook as a
  JSON file) and **Import** (merges a backup file back in). Because import uses the same
  conflict-free merge as sync, re-importing an old backup never wipes newer notes.

### Conflict-free sync (edit on two devices safely)

Sync **merges** rather than overwrites. Each note, lesson and homework item carries its
own `updatedAt` stamp, and deletions leave a small tombstone. When a device comes back
online the local and cloud notebooks are reconciled **item by item**:

- Notes added on different devices while offline are **both kept** (union by id).
- If the *same* note was edited on two devices, the **most recent edit wins**.
- A deletion on one device is honoured on the other (unless that note was edited again
  *after* it was deleted, in which case the newer edit is kept).

The merge is order-independent and idempotent, so devices always converge on the same
result with no endless push/pull loop. This replaces the old whole-notebook
"last writer wins" behaviour, which could silently drop the other device's changes.

### Multiple translations

When you attach a verse to a note, the Arabic and an English translation are filled in
automatically. A small **Translation** switch lets you choose between three bundled
English renderings — **Saheeh International** (default), **Abdullah Yusuf Ali**, and
**Marmaduke Pickthall** — for the whole Qur'an, entirely offline. Your choice is
remembered per device, and switching never overwrites a translation you've typed or
edited yourself. (The Yusuf Ali and Pickthall texts are public-domain translations
from the [Tanzil](https://tanzil.net) project.)

Each note can hold **several verses**, including from different sūrahs (e.g. a verse
from al-Baqarah and one from at-Tawbah on the same note). Fill a verse, tap
**"+ Add another verse"** to stack more, then save; each verse shows its real sūrah
name and āyah (e.g. "At-Tawbah · 9:20").

### Sync with your study partner

Notebooks are private by default, but Abdalla and Fathia can pool their work: the
sidebar shows a **"Sync with <partner>"** button. Tapping it does a **purely additive**
two-way merge through a shared space — it **only ever adds**: lessons your partner has
that you're missing are added, and within lessons you both have, any of their notes you
don't have are added. It **never deletes or overwrites** anything you already have. If
you've each edited the *same* seeded note differently, you each keep your own version
(the other's isn't forced on you), and deleting a note on one side does **not** remove
it from the other. After you both tap Sync once, each of you has the union of both
notebooks. It's on-demand — nothing reaches your partner until you press the button.
(Requires the `shared` Firebase rule above to be published.)

### Lessons organised by Sūrah

The sidebar groups lessons under the **Sūrah** they relate to (derived from the verses
their notes cite), in mushaf order, with collapsible headings — built to scale across
the whole Qur'an. A lesson moves into the right Sūrah automatically once its notes cite
that Sūrah; lessons with no verse yet sit under "Other lessons".

### Never lose an in-progress note

Notes you're composing are saved as a **per-lesson draft**: switch lessons or tabs,
close the app, or reload — your unfinished note is still there when you come back. A
draft clears when you save it, or you can **Discard** it.

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
       },
       "shared": {
         ".read":  "auth != null",
         ".write": "auth != null"
       }
     }
   }
   ```

   The `shared` node powers **"Sync with your study partner"** (below). It is
   readable/writable by any signed-in account in the project — fine for a private
   two-person journal; leave it out if you never use partner sync.

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

## Offline use (installable PWA)

The app is a **Progressive Web App**. A service worker (`sw.js`) caches the app
shell and its runtime dependencies (React, Babel, Firebase SDK) on first load, so
after visiting once it **opens and works with no connection at all** — not just your
notes, but the whole app. It's also **installable**: on mobile use "Add to Home
Screen" (or the install icon on desktop) to launch it full-screen like a native app.

Your work is always stored locally and continues to function offline (and without
signing in). When you sign in and come back online, changes reconcile with your own
private notebook in the cloud.

> The service worker only runs over HTTPS (e.g. your Netlify URL), not from a
> `file://` copy. `manifest.json` + `icon-192.png` / `icon-512.png` provide the
> install metadata and icon.

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
