// examples/todomvc/server.js
import { Hono } from '@hono/hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { renderToString } from '../../resumable/ssr/render.js';
import { TodoApp } from './TodoApp.js';

const app = new Hono();

// Serve static files from the project root
app.use('/resumable/*', serveStatic({ root: './' }));
app.use('/examples/*', serveStatic({ root: './' }));

// Main application route
app.get('/', (c) => {
  // Create an instance of the TodoApp component
  const todoAppInstance = TodoApp({ initialTodos: [
    { id: 1, text: 'Learn Resumable Web Dev', completed: true },
    { id: 2, text: 'Build a framework', completed: false },
    { id: 3, text: 'Profit!', completed: false },
  ]});

  // Render the component to an HTML string
  const appHtml = renderToString(todoAppInstance);

  // Return the full HTML page
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Resumable TodoMVC</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
        }
        
        .todoapp {
          width: 100%;
          max-width: 600px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
      </style>
      <link rel="stylesheet" href="/examples/todomvc/style.css">
    </head>
    <body>
      <section class="todoapp">
        ${appHtml}
      </section>
      
      <!-- Client-side bootstrap script -->
      <script type="module" src="/examples/todomvc/client.js"></script>
    </body>
    </html>
  `);
});

console.log('Server running on http://localhost:3002');
Deno.serve({ port: 3002 }, app.fetch);
