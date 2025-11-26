// examples/lib/build-page.js
// Build HTML for a page - pure function, no side effects

import { renderToString } from '../../resumable/ssr/render.js';
import { pages } from '../data/pages.js';

export function buildPage(path) {
  const config = pages[path];
  if (!config) throw new Error(`Unknown page: ${path}`);

  // Render all components
  const componentInstances = config.components.map(({ factory, props }) => factory(props));
  const renderedComponents = componentInstances.map(c => renderToString(c));
  
  // Extract SSR scripts
  const ssrScripts = renderedComponents
    .flatMap(html => html.match(/<script[^>]*>[\s\S]*?<\/script>/g) || [])
    .join('\n');

  // Build component registry for bootstrap
  const registryEntries = Object.entries(config.registry)
    .map(([name, comp]) => `'${name}': ${comp.name}`)
    .join(',\n      ');

  const importStatements = Object.entries(config.registry)
    .map(([_, comp]) => `import { ${comp.name} } from '/examples/components/${comp.name}.js';`)
    .join('\n  ');

  const bootstrap = `<script type="module">
  ${importStatements}
  import { initResumableApp } from '/resumable/core/runtime.js';
  initResumableApp({
    ${registryEntries}
  });
</script>`;

  // Build page content based on path
  const content = path === '/'
    ? renderedComponents[0] // First is DemoPage shell
    : config.components.map(() => `<demo-counter data-component-name="demo-counter"></demo-counter>`).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; }
    ${config.layoutStyles}
  </style>
</head>
<body>
  <div id="app">
    ${content}
  </div>
  ${ssrScripts}
  ${bootstrap}
</body>
</html>`;
}
