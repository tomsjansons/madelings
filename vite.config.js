import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const worlds = [
  'castle-robot',
  'pink-robot-horses-hay',
  'pink-robot-plane',
  'robot-chess',
  'robot-horse-jump',
  'robot-horses',
  'robot-painting',
  'robot-painting-trees',
  'violet-robot',
];

const worldPaths = new Set(worlds.map((world) => `/${world}`));

function serveWorldIndex(request, _response, next) {
  const [pathname, query] = (request.url ?? '').split('?');

  if (worldPaths.has(pathname)) {
    request.url = `${pathname}/index.html${query ? `?${query}` : ''}`;
  }

  next();
}

const directoryRoutes = {
  name: 'robot-world-directory-routes',
  configureServer(server) {
    server.middlewares.use(serveWorldIndex);
  },
  configurePreviewServer(server) {
    server.middlewares.use(serveWorldIndex);
  },
};

export default defineConfig({
  plugins: [directoryRoutes],
  appType: 'mpa',
  build: {
    rollupOptions: {
      input: {
        gallery: resolve(import.meta.dirname, 'index.html'),
        ...Object.fromEntries(
          worlds.map((world) => [world, resolve(import.meta.dirname, world, 'index.html')]),
        ),
      },
    },
  },
});
