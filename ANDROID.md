# Building the Android app (Google Play)

The app ships to Google Play as a **TWA** (Trusted Web Activity) — a thin
native wrapper around the live PWA at <https://piano.akash.fi>. It's generated
with [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap), Google's
official PWA→TWA tool, which is wired into the `android:*` pnpm scripts.

The wrapper loads the hosted site, so **whatever is deployed at piano.akash.fi
is what the app shows** — you only rebuild the APK/AAB when the app's identity
changes (name, icon, colours, manifest) or to ship a new versionCode.

## One-time setup

1. **Toolchain** — Bubblewrap needs JDK 17 and the Android SDK. On the first
   `init`/`build` it offers to download and manage both under `~/.bubblewrap`
   (just answer "Yes"). No system-wide Java/Android install required.

2. **Generate the wrapper project** (interactive, from the repo root):

   ```sh
   pnpm android:init
   ```

   It fetches the live manifest and asks for a few values. Use the existing
   listing's values so this stays an *update*, not a new app:

   - **Application ID / package name**: must match the published app exactly
     (e.g. `fi.akash.piano` — check Play Console → App → Dashboard). Getting
     this wrong creates a *separate* app on Play.
   - **App name / launcher name**: "Musical Sight".
   - **Signing key**: see the next section before answering.

   This writes `twa-manifest.json` (commit it) and an Android project.

## Signing — the important part

Google Play links every update to a signing key. Two layers:

- **App signing key** — held by Google if you're on **Play App Signing**
  (the default for recently published apps). You never see this key.
- **Upload key** — the key *you* sign the AAB with; Google verifies it, strips
  it, and re-signs with the app signing key. This is the keystore Bubblewrap
  uses.

**If you still have your upload keystore file**, point Bubblewrap at it during
`init` (or edit `signingKey` in `twa-manifest.json`) and reuse it every build.

**If you've lost the upload keystore** (the likely case here): you can't
recreate it, but you don't need the original. In **Play Console → your app →
Setup → App integrity → App signing**, request an **upload key reset** — Google
lets you register a *new* upload key while keeping the same app signing key, so
updates keep flowing to the same listing. Generate a fresh keystore:

```sh
keytool -genkeypair -v -keystore upload.keystore \
  -alias upload -keyalg RSA -keysize 2048 -validity 9125
```

Keep `upload.keystore` and its passwords safe and **out of git** (already
covered by not committing `*.keystore`). Register its SHA-256 with the reset
request.

> If you are *not* on Play App Signing and lost the original key, you cannot
> update the listing at all — you'd have to publish a new app. Check the App
> signing page to confirm which case you're in.

## Digital Asset Links (removes the URL bar)

For the TWA to run fullscreen (no browser address bar), the site must serve
`https://piano.akash.fi/.well-known/assetlinks.json` containing the SHA-256 of
the key Google signs releases with. On Play App Signing, copy that JSON from
**Play Console → App signing** (it lists the exact fingerprint) and deploy it to
the site. `bubblewrap fingerprint` also generates it from a keystore.

## Passwords (read this — it's the #1 gotcha)

Keystores are **PKCS12**, which supports only **one** password: the store and
key password must be **identical**. keytool silently forces the key password to
equal the store password at creation, so if Bubblewrap later signs with a
*different* key password you get `Wrong password? / BadPaddingException` even
though nothing is actually wrong.

Also avoid `$`, backtick and backslash in the password — Bubblewrap signs via a
shell command, so the shell expands them and the password gets mangled. Use
letters and digits only.

`pnpm android:build` reads passwords from env vars (no prompt if set). Keep them
identical:

```sh
export BUBBLEWRAP_KEYSTORE_PASSWORD='<letters-and-digits-only>'
export BUBBLEWRAP_KEY_PASSWORD='<same-value>'
```

If a build ever fails with "Wrong password?", it's almost always these two env
vars holding different values.

## Building

```sh
pnpm android:build
```

With the env vars above set (or by entering the same password at both prompts),
produces (in the project root):

- `app-release-bundle.aab` → **upload this to Play Console** (Play requires AAB).
- `app-release-signed.apk` → sideload onto a device for testing
  (`adb install app-release-signed.apk`).

Before each release, bump `appVersion` / `appVersionCode` in `twa-manifest.json`
(Play rejects a versionCode it has already seen).

## Syncing manifest/icon changes

If you change `public/manifest.json` (name, colours, icons), pull the changes
into the wrapper and rebuild:

```sh
pnpm android:update   # re-reads the manifest into twa-manifest.json
pnpm android:build
```

## Commands (wired in package.json)

| Command | What it does |
| --- | --- |
| `pnpm android:doctor` | Check JDK/SDK setup |
| `pnpm android:init` | Generate the TWA project from the live manifest (first time) |
| `pnpm android:update` | Re-sync `twa-manifest.json` from the manifest |
| `pnpm android:build` | Build the signed `.aab` (Play) and `.apk` (sideload) |
