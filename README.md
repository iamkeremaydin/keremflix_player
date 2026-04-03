# Keremflix 🎬

A small local video player that runs in your browser. Your files stay on your machine. No upload, no cloud story, just pick a file and watch.

[screenshot]

## What it does

Playback from disk with the File System Access API, a simple history so you can jump back to what you were watching, subtitles that scale with the video, and a quiet UI so the video is the point.

## Stack (roughly)

Next.js 16 with the App Router, React 19, TypeScript 6, Tailwind v4, Zustand for client state.

## Quick start (if you like the terminal)

1. Install deps:

```bash
npm install
```

2. Run dev (default port 3000):

```bash
npm run dev
```

3. Open `http://localhost:3000`, pick a local video, done.

## Pull once, then go offline

How to get a copy and work without internet after the first install:

1. **While online:** `git clone` your repo (fork first on GitHub if you want), `cd` into it, then `npm install`. `package-lock.json` keeps versions steady; `npm ci` is the picky version of that.
2. **Go offline:** run `npm run dev`, open `http://localhost:3000`, hack away. No network needed for normal edits once `node_modules` exists.
3. **Online again when:** you add packages, upgrade deps, use a new machine, or `git pull` and the lock file changed (then `npm install` again).
4. **Extras (all local):** `npm run build`, `npm run lint`.

## Quick start (if you are not into terminals)

There is a `launch` folder with helpers. They use a **fixed port 3333** on purpose so we never chase Next when 3000 is already taken. The app URL is **`http://localhost:3333`**.

**Windows:** double click `launch/windows/start_windows.vbs`. A visible step checks Node and runs install if needed, then the server runs minimized and the browser should open when ready. To stop without hunting Task Manager, double click `launch/windows/stop_windows.bat` (it only stops whatever is listening on 3333, not every Node app on your PC).

**Mac or Linux:** ZIP downloads often strip the execute bit, so double clicking `launch/start_maclinux.command` might do nothing. Easiest first time: open Terminal, then run:

```bash
bash /path/to/keremflix/launch/start_maclinux.sh
```

(use your real path). If you prefer double click later, you can `chmod +x launch/start_maclinux.command` once. On Mac, quarantined downloads sometimes need Right click → Open the first time.

Under the hood those scripts call `npm run dev:launch`, same as you could run yourself from the repo root after `npm install`.
