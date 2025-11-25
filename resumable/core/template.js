// resumable/core/template.js

const isServer = typeof window === 'undefined';
const templateCache = new Map();
const placeholder = `__PLACEHOLDER__${Date.now()}__`;

/**
 * A tagged template literal function for HTML.
 * On the server, it performs simple string concatenation.
 * On the client, it's the entry point for a more sophisticated
 * template processing system that enables fine-grained DOM updates.
 *
 * @param {TemplateStringsArray} strings The static parts of the template.
 * @param {...any} values The dynamic values to interpolate.
 * @returns {{strings: TemplateStringsArray, values: any[], _isTemplateResult: true}}
 */
export function html(strings, ...values) {
  return {
    strings,
    values,
    _isTemplateResult: true,
    _valueIndices: new Map(), // Track which string position has which value index
    toString() {
      // Basic toString for server-side rendering or debugging.
      // Handle arrays of template results (from .map())
      return this.strings.reduce((acc, str, i) => {
        let val = this.values[i];
        if (val === undefined) {
          return acc + str;
        }
        // If it's an array of template results, join them without commas
        if (Array.isArray(val)) {
          val = val.map(v => {
            if (v && v._isTemplateResult) {
              return v.toString();
            }
            return v;
          }).join('');
        } else if (val && val._isTemplateResult) {
          // Single template result
          val = val.toString();
        }
        // Track position for reactive updates
        this._valueIndices.set(i, i);
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

/**
 * Processes a template on the client to prepare it for rendering.
 * It parses the static HTML structure and identifies the locations
 * of dynamic parts (bindings). This is a one-time cost per template structure.
 *
 * @param {TemplateResult} result The result from the `html` function.
 * @returns {{fragment: DocumentFragment, bindings: Binding[]}}
 */
export function processTemplate(result) {
  const { strings } = result;
  if (templateCache.has(strings)) {
    return templateCache.get(strings);
  }

  const template = document.createElement('template');
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
            const parts = attr.value.split(placeholder);
            bindings.push({ type: 'attribute', node, name: attr.name, parts, index });
            index += parts.length - 1;
          }
        }
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent.includes(placeholder)) {
        const parts = node.textContent.split(placeholder);
        let lastNode = node;
        for (let i = 1; i < parts.length; i++) {
            const textNode = document.createTextNode(parts[i]);
            lastNode.after(textNode);
            bindings.push({ type: 'text', node: lastNode, index });
            index++;
            lastNode = textNode;
        }
        node.textContent = parts[0]; // Update original node
      }
    }
    node = walker.nextNode();
  }
  
  bindings.sort((a, b) => a.index - b.index);
  
  const processed = { fragment: template.content, bindings };
  templateCache.set(strings, processed);
  return processed;
}
