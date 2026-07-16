# Robot Worlds

A pnpm workspace containing nine interactive Three.js scenes and a shared gallery landing page.

## Development

```sh
pnpm install
pnpm dev
```

Open `http://localhost:5173/` for the gallery. Each workspace is mounted at its folder name, for example `http://localhost:5173/robot-chess`.

## Commands

- `pnpm dev` — run the complete multi-page site
- `pnpm build` — build the gallery and every robot world to `dist/`
- `pnpm preview` — preview the production build
- `pnpm test` — run tests in every workspace that defines them
