// examples/server.js
// Server - simple, direct

import { Hono } from '@hono/hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { buildPage } from './lib/build-page.js';

const app = new Hono();

app.use('/resumable/*', serveStatic({ root: './' }));
app.use('/examples/*', serveStatic({ root: './' }));

app.get('/', (c) => c.html(buildPage('/')));
app.get('/counter', (c) => c.html(buildPage('/counter')));

const PORT = 3002;
console.log(`\n🚀 Resumable Server - http://localhost:${PORT}\n`);

Deno.serve({ port: PORT }, app.fetch);
