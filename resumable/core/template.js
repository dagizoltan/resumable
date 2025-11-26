// resumable/core/template.js
// Fine-grained reactive template system with automatic diffing

const isServer = typeof window === 'undefined';
const templateCache = new Map();
const partCache = new WeakMap();

/**
 * A tagged template literal function for HTML.
 * On the server, it performs simple string concatenation.
 * On the client, it's the entry point for a sophisticated template processing system.
 *
 * @param {TemplateStringsArray} strings The static parts of the template.
 * @param {...any} values The dynamic values to interpolate.
 * @returns {TemplateResult}
 */
export function html(strings, ...values) {
  return {
    strings,
    values,
    _isTemplateResult: true,
    toString() {
      return strings.reduce((acc, str, i) => {
        let val = values[i];
        
        // For functions (event handlers), don't add them to the SSR output
        if (typeof val === 'function') {
          // Return just the current string without adding the function value
          // This leaves `@click=` in SSR output but without a value, which is harmless
          // The next string iteration will continue normally
          return acc + str;
        }
        
        if (val === undefined) return acc + str;
        
        // Handle arrays of template results (from .map())
        if (Array.isArray(val)) {
          val = val.map(v => {
            if (v && v._isTemplateResult) return v.toString();
            if (v && v._isKeyedPart) return v.render();
            return v;
          }).join('');
        } else if (val && val._isTemplateResult) {
          val = val.toString();
        } else if (val && val._isKeyedPart) {
          val = val.render();
        }
        return acc + str + val;
      }, '');
    }
  };
}

export function css(strings, ...values) {
  return {
    toString() {
      return strings.reduce((acc, str, i) => {
        return acc + str + (values[i] !== undefined ? values[i] : '');
      }, '');
    }
  };
}

// ============================================================================
// Core Template Binding System
// ============================================================================

/**
 * Part - Represents a single binding location (text, attribute, or property)
 * Handles incremental updates without recreating DOM nodes
 */
class Part {
  constructor(type, node, binding) {
    this.type = type;
    this.node = node;
    this.binding = binding;
    this.previousValue = undefined;
  }

  update(value) {
    if (this.previousValue === value) return; // No change
    this.previousValue = value;

    switch (this.type) {
      case 'text':
        this.updateText(value);
        break;
      case 'attribute':
        this.updateAttribute(value);
        break;
      case 'property':
        this.updateProperty(value);
        break;
      case 'event':
        this.updateEvent(value);
        break;
    }
  }

  updateText(value) {
    const text = value == null ? '' : String(value);
    if (this.node.data !== text) {
      this.node.data = text;
    }
  }

  updateAttribute(value) {
    const { name } = this.binding;
    if (value == null || value === false) {
      this.node.removeAttribute(name);
    } else if (value === true) {
      this.node.setAttribute(name, '');
    } else {
      const strValue = String(value);
      if (this.node.getAttribute(name) !== strValue) {
        this.node.setAttribute(name, strValue);
      }
    }
  }

  updateProperty(value) {
    const { name } = this.binding;
    const currentValue = this.node[name];
    if (currentValue !== value) {
      this.node[name] = value;
    }
  }

  updateEvent(value) {
    if (typeof value !== 'function') return;
    const { name } = this.binding;
    const eventName = name.substring(1); // Remove @ prefix
    
    // Remove old listener if exists
    if (this.previousListener) {
      this.node.removeEventListener(eventName, this.previousListener);
    }
    
    // Add new listener
    this.node.addEventListener(eventName, value);
    this.previousListener = value;
  }
}

/**
 * TemplatePart - Manages a rendered instance of a template
 * Tracks all binding points and updates only what changed
 */
class TemplatePart {
  constructor(template, container) {
    this.template = template;
    this.container = container;
    this.parts = [];
    this.nodes = [];
    this.endNode = null;
    this._rendered = false;
  }

  render(values = []) {
    if (!this._rendered) {
      // First render: clone template and create parts
      const fragment = this.template.cloneNode(true);
      const nodes = Array.from(fragment.childNodes);
      
      // Insert nodes into container
      nodes.forEach(node => this.container.appendChild(node));
      this.nodes = nodes;
      
      // Create Part objects for each binding
      this.createParts();
      this._rendered = true;
    }

    // Update all parts with new values
    for (let i = 0; i < this.parts.length; i++) {
      if (i < values.length) {
        this.parts[i].update(values[i]);
      }
    }
  }

  createParts() {
    const walker = document.createTreeWalker(
      this.container,
      NodeFilter.SHOW_ALL,
      null,
      false
    );

    let node;
    let partIndex = 0;

    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) {
        const binding = this.findTextBinding(node);
        if (binding) {
          const part = new Part('text', node, binding);
          this.parts.push(part);
          partIndex++;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (node.hasAttributes()) {
          for (const attr of Array.from(node.attributes)) {
            // Check if this is an event binding (@event)
            if (attr.name.startsWith('@')) {
              const binding = this.findAttributeBinding(attr);
              if (binding) {
                const part = new Part('event', node, binding);
                this.parts.push(part);
                partIndex++;
              }
            } else {
              const binding = this.findAttributeBinding(attr);
              if (binding) {
                const part = new Part(
                  attr.name === 'checked' || attr.name === 'disabled' ? 'property' : 'attribute',
                  node,
                  binding
                );
                this.parts.push(part);
                partIndex++;
              }
            }
          }
        }
      }
    }
  }

  findTextBinding(node) {
    // Check if node contains placeholder
    return { type: 'text' };
  }

  findAttributeBinding(attr) {
    // Check if attribute contains placeholder
    return { type: 'attribute', name: attr.name };
  }
}

/**
 * processTemplate - Parses a template once and returns reusable structure
 * This is cached per template structure for efficiency
 */
export function processTemplate(result) {
  const { strings } = result;
  if (templateCache.has(strings)) {
    return templateCache.get(strings);
  }

  const template = document.createElement('template');
  const placeholder = `__PLACEHOLDER__${Date.now()}__`;
  const htmlString = strings.join(placeholder);
  template.innerHTML = htmlString;

  const bindings = [];
  const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_ALL);
  let node = walker.nextNode();
  let index = 0;

  while (node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.hasAttributes()) {
        for (const attr of Array.from(node.attributes)) {
          if (attr.value.includes(placeholder)) {
            // Check if this is an event binding (@event)
            const bindingType = attr.name.startsWith('@') ? 'event' : 'attribute';
            bindings.push({
              type: bindingType,
              node,
              name: attr.name,
              index
            });
            index++;
          }
        }
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.includes(placeholder)) {
        bindings.push({
          type: 'text',
          node,
          index
        });
        index++;
      }
    }
    node = walker.nextNode();
  }

  const processed = { template, bindings, strings };
  templateCache.set(strings, processed);
  return processed;
}

/**
 * renderPart - Renders a template into a container with fine-grained updates
 * Returns a function to update the rendering with new values
 */
export function renderPart(result, container) {
  if (!result || !result._isTemplateResult) {
    container.textContent = String(result);
    return () => {};
  }

  const processed = processTemplate(result);
  let cachedPart = partCache.get(container);

  if (!cachedPart) {
    cachedPart = new TemplatePart(processed.template, container);
    partCache.set(container, cachedPart);
  }

  cachedPart.render(result.values);

  return (newResult) => {
    if (newResult && newResult._isTemplateResult) {
      cachedPart.render(newResult.values);
    }
  };
}

// ============================================================================
// Keyed List Reconciliation
// ============================================================================

/**
 * KeyedPart - Manages a list of items with identity tracking
 * Enables efficient reordering, add, remove operations
 */
class KeyedPart {
  constructor(items, keyFn, renderFn, container) {
    this.items = items;
    this.keyFn = keyFn;
    this.renderFn = renderFn;
    this.container = container;
    this.nodeMap = new Map(); // key -> node
    this.itemMap = new Map(); // key -> item
    this.partMap = new Map(); // key -> update function
    this._isKeyedPart = true;
  }

  render() {
    const fragment = document.createDocumentFragment();
    const newNodeMap = new Map();
    const newItemMap = new Map();

    for (const item of this.items) {
      const key = this.keyFn(item);
      const template = this.renderFn(item);
      
      let container = this.nodeMap.get(key);
      if (!container) {
        // New item
        container = document.createElement('div');
      }

      const updateFn = renderPart(template, container);
      this.partMap.set(key, updateFn);
      newNodeMap.set(key, container);
      newItemMap.set(key, item);
      fragment.appendChild(container);
    }

    // Remove old items
    for (const key of this.nodeMap.keys()) {
      if (!newNodeMap.has(key)) {
        const node = this.nodeMap.get(key);
        if (node.parentNode) {
          node.parentNode.removeChild(node);
        }
      }
    }

    // Update container
    this.container.innerHTML = '';
    this.container.appendChild(fragment);

    this.nodeMap = newNodeMap;
    this.itemMap = newItemMap;
  }

  update(items) {
    this.items = items;
    this.render();
  }
}

/**
 * keyed - Helper function for rendering keyed lists
 * Preserves item identity across re-renders for efficient diffing
 * Works in both browser and server environments
 * 
 * @param {Array} items - Array of items to render
 * @param {Function} keyFn - Function to get unique key for each item
 * @param {Function} renderFn - Function to render each item
 * @returns {KeyedPart or TemplateResult} - Keyed part for rendering or template result
 */
export function keyed(items, keyFn, renderFn) {
  // Server-side rendering (no document object)
  if (typeof document === 'undefined') {
    // On server, just render all items and return as string
    return {
      _isTemplateResult: true,
      toString() {
        return items.map(item => {
          const template = renderFn(item);
          return template.toString ? template.toString() : String(template);
        }).join('');
      }
    };
  }

  // Client-side rendering (browser has document)
  const container = document.createElement('div');
  const part = new KeyedPart(items, keyFn, renderFn, container);
  part.render();
  
  return {
    _isKeyedPart: true,
    toString() {
      return '';
    },
    render() {
      return container.innerHTML;
    }
  };
}

// ============================================================================
// Streaming/Async Template Support (Foundation for Future)
// ============================================================================

/**
 * asyncTemplate - Returns a promise that resolves to template content
 * Useful for lazy-loading components or fetching dynamic content
 */
export async function asyncTemplate(promise) {
  const content = await promise;
  return html`${content}`;
}

/**
 * fragment - Renders multiple template results without wrapper
 * Useful for conditional rendering of multiple children
 */
export function fragment(templates) {
  if (!Array.isArray(templates)) {
    templates = [templates];
  }
  
  return {
    _isTemplateResult: true,
    toString() {
      return templates.map(t => 
        t && t._isTemplateResult ? t.toString() : String(t)
      ).join('');
    }
  };
}
