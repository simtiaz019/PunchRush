# PunchRush

Mobile-first Phaser arcade game: **10 Seconds. Maximum Punches.** Photos are processed locally into comic avatars; no backend or paid API is required.

## Run locally

```bash
npm install
npm run dev
```

Open the displayed local URL. For a production build: `npm run build` then `npm run preview`.

## Checks

```bash
npm run typecheck
npm test
npm run build
```

## Docker

```bash
docker compose up -d --build
```

Then open `http://localhost:8080`.

## Windows NUC + Cloudflare Tunnel (`simtiaz.com/punchrush`)

The Docker image uses `build:nuc`, which sets the Vite base path to `/punchrush/`. The compose port is loopback-only, so it is not exposed directly to your LAN or the Internet.

1. Install Docker Desktop on the Windows NUC, clone/copy this repository, then run `docker compose up -d --build` from the project folder.
2. In Cloudflare, create a Tunnel on the NUC and publish `punchrush-origin.simtiaz.com` to `http://localhost:8080`.
3. Create a Cloudflare Worker on routes `simtiaz.com/punchrush` and `simtiaz.com/punchrush/*`. The Worker should proxy to `punchrush-origin.simtiaz.com` while stripping the `/punchrush` prefix.

No router port forwarding or public home IP is required. See the deployment instructions supplied with this project for the complete Cloudflare setup.

## Deployment

The build output is the static `dist/` directory, so it can be deployed directly to Cloudflare Pages (build command `npm run build`, output directory `dist`), Netlify, GitHub Pages with an SPA fallback, or any static host.

## Optional ComfyUI

`BrowserCartoonProvider` is the default local Canvas pipeline. `ComfyUICartoonProvider` is available as an extensibility point; set `VITE_COMFYUI_CARTOON_URL` to a self-hosted endpoint that accepts `{ image, style }` and returns `{ image }`. This optional route should disclose transmission to players and delete temporary files.

## Notes

HEIC decoding depends on the browser. MediaPipe-compatible face-detection integration is intentionally not needed for the baseline local cartoon crop: the browser pipeline center-crops and cartoonizes safely when detection is unavailable. A provider boundary supports adding a detector without changing UI or gameplay.
