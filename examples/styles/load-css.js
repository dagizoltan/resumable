// examples/styles/load-css.js
/**
 * Load CSS from a file and inject into shadow DOM
 * Shadow DOM doesn't support <link> tags, so we must:
 * 1. Fetch the CSS file
 * 2. Create a <style> tag
 * 3. Inject into shadowRoot
 */
export async function loadCSS(path) {
  try {
    const response = await fetch(path);
    const css = await response.text();
    return css;
  } catch (e) {
    console.error(`Failed to load CSS from ${path}:`, e);
    return '';
  }
}

/**
 * Create a style tag with CSS content for shadow DOM injection
 */
export function createStyleElement(cssContent) {
  const styleTag = document.createElement('style');
  styleTag.textContent = cssContent;
  return styleTag;
}

/**
 * Inject CSS into a shadow root
 * Usage: await injectCSS(element.shadowRoot, '/examples/styles/counter.css')
 */
export async function injectCSS(shadowRoot, cssPath) {
  const css = await loadCSS(cssPath);
  if (css) {
    const style = createStyleElement(css);
    shadowRoot.insertBefore(style, shadowRoot.firstChild);
  }
}
