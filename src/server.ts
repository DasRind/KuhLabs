import {
  bootstrapApplication,
  BootstrapContext,
} from '@angular/platform-browser';
import { provideServerRendering } from '@angular/ssr';
import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join, extname } from 'node:path';
import { existsSync } from 'node:fs';
import { appConfig } from './app/app.config';
import { App } from './app/app';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve precompressed static assets when available (no 3rd‑party deps).
 * Looks for .br (Brotli) or .gz alongside the original file.
 */
const compressible = new Set(['.js', '.css', '.html', '.svg', '.json', '.txt', '.xml']);
const mime: Record<string, string> = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.txt': 'text/plain',
  '.xml': 'application/xml',
};

app.get(/\.(js|css|html|svg|json|txt|xml)$/i, (req, res, next) => {
  try {
    const enc = (req.header('Accept-Encoding') || '').toLowerCase();
    const ext = extname(req.path).toLowerCase();
    if (!compressible.has(ext)) return next();

    const abs = join(browserDistFolder, req.path);
    if (enc.includes('br') && existsSync(abs + '.br')) {
      res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
      res.setHeader('Content-Encoding', 'br');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(abs + '.br');
    }
    if (enc.includes('gzip') && existsSync(abs + '.gz')) {
      res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
      res.setHeader('Content-Encoding', 'gzip');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(abs + '.gz');
    }
  } catch {}
  return next();
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
    setHeaders: (res, path) => {
      // Encourage long-term caching for static assets
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    },
  })
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next()
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

export default function bootstrap(context: BootstrapContext) {
  return bootstrapApplication(
    App,
    {
      providers: [
        provideServerRendering(),
        ...appConfig.providers, // deine globalen Provider
      ],
    },
    context
  );
}
