// resumable/ssr/render.js

// Generate unique instance IDs for components
let instanceIdCounter = 0;

/**
 * Renders a component instance to a clean HTML string.
 * The server's responsibility is to generate the initial HTML and state.
 * All binding discovery is now handled by the client-side `processTemplate`.
 *
 * @param {object} componentInstance - A plain object from a component factory.
 * @returns {string} The HTML string representation of the component.
 */
export function renderToString(componentInstance) {
  if (!componentInstance || !componentInstance.name) {
    throw new Error('Invalid component instance provided to renderToString.');
  }

  const { name, view, style, actions, _serializedState } = componentInstance;
  
  // Generate a unique instance ID for this component instance
  const instanceId = `${name}-${++instanceIdCounter}`;

  // 1. Get the template result from the view function.
  const templateResult = view({ state: componentInstance.state, actions });
  const html = templateResult.toString();

  // 2. Serialize the initial state - use the pre-processed unwrapped state
  const serializedState = JSON.stringify(_serializedState || {});
  
  // 3. Store the SSR content as a script tag
  const ssrContent = `${style ? `<style>${style.toString()}</style>` : ''}${html}`;

  // 4. Construct the final HTML with unique instance ID
  const finalHtml = `
    <${name} data-component-name="${name}" data-instance-id="${instanceId}"></${name}>
    <script type="application/json" data-component-state="${instanceId}">
      ${serializedState}
    </script>
    <script type="application/json" data-component-ssr="${instanceId}">
      ${JSON.stringify({ content: ssrContent })}
    </script>
  `;
  
  return finalHtml.trim();
}
