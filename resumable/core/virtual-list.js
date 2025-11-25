// resumable/core/virtual-list.js
// Efficient virtual windowing for rendering large lists

export class VirtualList {
  constructor(options = {}) {
    this.itemHeight = options.itemHeight || 45;
    this.overscan = options.overscan || 20; // Items to render outside viewport
    this.scrollTop = 0;
    this.containerHeight = options.containerHeight || 600;
    this.pool = new Map(); // DOM node pool for recycling
    this.itemTemplate = options.itemTemplate || null;
  }

  /**
   * Calculate which items should be visible
   * @param {number} scrollTop - Current scroll position
   * @param {number} containerHeight - Height of visible area
   * @param {number} totalItems - Total number of items
   * @returns {Object} { startIndex, endIndex, offsetTop }
   */
  getVisibleRange(scrollTop, containerHeight, totalItems) {
    const visibleCount = Math.ceil(containerHeight / this.itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.overscan);
    const endIndex = Math.min(totalItems, startIndex + visibleCount + this.overscan * 2);
    const offsetTop = startIndex * this.itemHeight;

    return {
      startIndex,
      endIndex,
      visibleCount,
      offsetTop,
    };
  }

  /**
   * Render visible items efficiently
   * @param {Array} items - All items
   * @param {Function} renderItem - Function to render single item
   * @param {HTMLElement} container - Container element
   */
  render(items, renderItem, container) {
    if (!container) return;

    const { startIndex, endIndex, offsetTop } = this.getVisibleRange(
      this.scrollTop,
      this.containerHeight,
      items.length
    );

    // Create viewport div if needed
    let viewport = container._virtualViewport;
    if (!viewport) {
      viewport = document.createElement('div');
      viewport.style.position = 'relative';
      viewport.style.height = `${items.length * this.itemHeight}px`;
      container.innerHTML = '';
      container.appendChild(viewport);
      container._virtualViewport = viewport;
    }

    // Update viewport height
    viewport.style.height = `${items.length * this.itemHeight}px`;

    // Create content container if needed
    let content = container._virtualContent;
    if (!content) {
      content = document.createElement('div');
      content.style.position = 'absolute';
      content.style.top = '0';
      content.style.left = '0';
      content.style.right = '0';
      viewport.appendChild(content);
      container._virtualContent = content;
    }

    // Update content position
    content.style.transform = `translateY(${offsetTop}px)`;

    // Render visible items
    const fragment = document.createDocumentFragment();
    const visibleItems = items.slice(startIndex, endIndex);

    visibleItems.forEach((item, idx) => {
      const element = renderItem(item, startIndex + idx);
      fragment.appendChild(element);
    });

    // Replace content
    content.innerHTML = '';
    content.appendChild(fragment);
  }

  /**
   * Get a DOM element from pool or create new
   * @param {string} tag - HTML tag name
   * @returns {HTMLElement} Pooled or new element
   */
  getPooledElement(tag = 'li') {
    const key = `pool_${tag}`;
    if (!this.pool.has(key)) {
      this.pool.set(key, []);
    }

    const pool = this.pool.get(key);
    return pool.length > 0 ? pool.pop() : document.createElement(tag);
  }

  /**
   * Return element to pool for reuse
   * @param {string} tag - HTML tag name
   * @param {HTMLElement} element - Element to pool
   */
  releasePooledElement(tag, element) {
    const key = `pool_${tag}`;
    if (!this.pool.has(key)) {
      this.pool.set(key, []);
    }
    element.innerHTML = '';
    this.pool.get(key).push(element);
  }

  /**
   * Update scroll position
   * @param {number} scrollTop - New scroll position
   */
  setScrollTop(scrollTop) {
    this.scrollTop = scrollTop;
  }

  /**
   * Update container height
   * @param {number} height - New height
   */
  setContainerHeight(height) {
    this.containerHeight = height;
  }

  /**
   * Cleanup pooled elements
   */
  destroy() {
    this.pool.clear();
  }
}

/**
 * Hook for detecting scroll position in Shadow DOM
 * Usage: setupVirtualListScrolling(shadowRoot, virtualList, effect)
 */
export function setupVirtualListScrolling(shadowRoot, virtualList, effectFn) {
  if (!shadowRoot) return;

  const container = shadowRoot.querySelector('.todo-list');
  if (!container) return;

  // Create scroll observer wrapper (Shadow DOM compatible)
  let scrollTimeout;
  const handleScroll = () => {
    clearTimeout(scrollTimeout);
    virtualList.setScrollTop(container.scrollTop);

    // Debounce re-render
    scrollTimeout = setTimeout(() => {
      effectFn();
    }, 16); // ~60fps
  };

  // Use passive event listener for better scroll performance
  container.addEventListener('scroll', handleScroll, { passive: true });

  return () => {
    clearTimeout(scrollTimeout);
    container.removeEventListener('scroll', handleScroll);
  };
}

/**
 * Get estimated height for items (for calculating scroll height)
 */
export function estimateItemHeight(itemCount, knownHeights = []) {
  if (knownHeights.length === 0) return 45; // default
  const avg = knownHeights.reduce((a, b) => a + b, 0) / knownHeights.length;
  return Math.round(avg);
}
