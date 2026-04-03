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

## Take it and make it yours (disconnect from this repo)

If you like it and want your own version, you do not have to stay tied to this project’s remote. Roughly how:

1. **Easiest:** fork it on GitHub, then `git clone` **your** fork. Your `origin` is yours; push and branch without needing anything from here.
2. **Already cloned from here?** Point Git at your repo instead, for example `git remote set-url origin https://github.com/you/your-copy.git`, or `git remote remove origin` and `git remote add origin` with your URL. You can skip adding this repo again unless you want to pull updates sometimes (`upstream` is optional).
3. **Then:** `npm install`, `npm run dev`, open `http://localhost:3000`, rename things, change copy, break stuff on purpose. `npm run build` and `npm run lint` work the same. Treat `package-lock.json` like any other Node project if you add packages.

You are not signing up for anything by cloning. This is just a starting point you can walk away with.

## Quick start (if you are not into terminals)

There is a `launch` folder with helpers. They use a **fixed port 3333** on purpose so we never chase Next when 3000 is already taken. The app URL is **`http://localhost:3333`**.

**Windows:** double click `launch/windows/start_windows.vbs`. A visible step checks Node and runs install if needed, then the server runs minimized and the browser should open when ready. To stop without hunting Task Manager, double click `launch/windows/stop_windows.bat` (it only stops whatever is listening on 3333, not every Node app on your PC).

**Mac or Linux:** ZIP downloads often strip the execute bit, so double clicking `launch/start_maclinux.command` might do nothing. Easiest first time: open Terminal, then run:

```bash
bash /path/to/keremflix/launch/start_maclinux.sh
```

(use your real path). If you prefer double click later, you can `chmod +x launch/start_maclinux.command` once. On Mac, quarantined downloads sometimes need Right click → Open the first time.

Under the hood those scripts call `npm run dev:launch`, same as you could run yourself from the repo root after `npm install`.
