# 🎌 MangaDex Discord Presence

Show what manga you're reading on your Discord profile — automatically.

---

## How It Works

```
MangaDex (browser) → Extension → Desktop App → Discord
```

1. You open a chapter on MangaDex
2. The **browser extension** detects the URL and fetches manga info from the MangaDex API
3. It sends the data to the **desktop app** running locally
4. The desktop app updates your **Discord Rich Presence**

---

## Setup Guide

### Step 1 — Create a Discord Application

1. Go to [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** → name it **MangaDex** (or anything you like)
3. Copy the **Application ID** (shown on the General Information page)
4. Go to the **Rich Presence** tab → **Art Assets**
5. Upload at least one image and name it `mangadex_logo` (use the MangaDex logo PNG)
6. Optionally add `reading_icon` and `browsing_icon` assets too

### Step 2 — Configure the Desktop App

1. Open `desktop/index.js`
2. Find this line near the top:
   ```js
   const CLIENT_ID = "YOUR_DISCORD_CLIENT_ID_HERE";
   ```
3. Replace `YOUR_DISCORD_CLIENT_ID_HERE` with your Application ID from Step 1

### Step 3 — Install Node.js

- Download and install from [https://nodejs.org](https://nodejs.org) (LTS version recommended)

### Step 4 — Start the Desktop App

- Double-click `desktop/start.bat`
- It will install dependencies automatically on first run
- Keep this window open while you browse MangaDex

### Step 5 — Load the Browser Extension

1. Open Chrome or Edge
2. Go to `chrome://extensions` (or `edge://extensions`)
3. Enable **Developer Mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `extension/` folder from this project
6. The MangaDex Presence icon will appear in your toolbar

### Step 6 — Test It!

1. Make sure Discord is open
2. Make sure the desktop app (`start.bat`) is running
3. Open any chapter on [mangadex.org](https://mangadex.org)
4. Check your Discord profile — your status should update within a few seconds!

---

## What Shows in Discord

| Field | Example |
|-------|---------|
| Large image | Manga cover art |
| Large image text | Manga title |
| Details | Manga title |
| State | Chapter 42 — The Battle Begins |
| Elapsed time | How long you've been reading |
| Button | "View on MangaDex" link |

---

## Folder Structure

```
mangadex-presence/
├── extension/          ← Load this folder in Chrome/Edge
│   ├── manifest.json
│   ├── background.js   ← Fetches MangaDex API, talks to desktop app
│   ├── content.js      ← Detects page changes on MangaDex
│   ├── popup.html      ← Extension popup UI
│   ├── popup.js
│   └── icons/          ← Add your icons here (see below)
│
└── desktop/            ← Run start.bat to launch
    ├── index.js        ← Express server + Discord RPC
    ├── package.json
    └── start.bat       ← Windows launcher
```

---

## Adding Extension Icons

Place these PNG files in `extension/icons/`:
- `icon16.png` (16×16)
- `icon48.png` (48×48)
- `icon128.png` (128×128)

You can use the MangaDex logo or any icon you like.

---

## Troubleshooting

**Presence not showing up?**
- Make sure Discord is open and you're logged in
- Make sure the desktop app window is open (not minimized to tray)
- Check that your Application ID in `index.js` is correct

**Extension shows "Desktop app not running"?**
- Start `start.bat` first
- Make sure nothing else is using port 43215

**Cover art not showing in Discord?**
- Discord only shows images that are uploaded to your app's Art Assets OR hosted on whitelisted CDNs. For cover images from MangaDex, they appear as large image URLs — this requires Discord Nitro or may not render for all users. As a fallback, upload `mangadex_logo` to your app's assets.

---

## Notes

- The desktop app only listens on `127.0.0.1` (localhost) — it is not exposed to the internet
- No login or API keys are needed for MangaDex's public API
- Discord must be running for Rich Presence to work
