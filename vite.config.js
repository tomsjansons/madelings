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

function redirectWorldDirectories(request, response, next) {
  const [pathname, query] = (request.url ?? '').split('?');

  if (worldPaths.has(pathname)) {
    response.statusCode = 308;
    response.setHeader('Location', `${pathname}/${query ? `?${query}` : ''}`);
    response.end();
    return;
  }

  next();
}

const directoryRoutes = {
  name: 'robot-world-directory-routes',
  configureServer(server) {
    server.middlewares.use(redirectWorldDirectories);
  },
  configurePreviewServer(server) {
    server.middlewares.use(redirectWorldDirectories);
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
