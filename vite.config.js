import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const projectRoot = process.cwd();
const sourceRoot = resolve(projectRoot, 'src');
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

const pages = { gallery: resolve(sourceRoot, 'index.html') };
for (const world of worlds) {
  pages[world] = resolve(sourceRoot, world, 'index.html');
}

const worldPaths = new Set(worlds.map((world) => `/${world}`));

function redirectWorldDirectories(request, response, next) {
  const [pathname, query] = (request.url || '').split('?');

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
  root: sourceRoot,
  plugins: [directoryRoutes],
  appType: 'mpa',
  build: {
    outDir: resolve(projectRoot, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: pages,
    },
  },
});
