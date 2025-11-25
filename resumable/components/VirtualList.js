
import { component } from '../core/component.js';
import { signal, computed } from '../core/signals.js';
import { html } from '../core/template.js';

export const VirtualList = component({
  props: {
    items: { type: Array, default: [] },
    itemHeight: { type: Number, default: 30 },
    containerHeight: { type: Number, default: 300 },
  },
  
  state: ({ items, itemHeight, containerHeight }) => ({
    scrollTop: signal(0),
    visibleItemCount: Math.ceil(containerHeight / itemHeight),
    startIndex: computed(({ scrollTop }) => Math.floor(scrollTop.value / itemHeight)),
    visibleItems: computed(({ startIndex, visibleItemCount }) => {
      return items.slice(startIndex.value, startIndex.value + visibleItemCount);
    }),
  }),
  
  actions: ({ state }) => ({
    handleScroll(event) {
      state.scrollTop.value = event.target.scrollTop;
    },
  }),
  
  view: ({ props, state, actions }) => {
    const { items, itemHeight, containerHeight } = props;
    const { visibleItems, startIndex } = state;

    return html`
      <div 
        style="height: ${containerHeight}px; overflow-y: auto;"
        data-on-scroll="handleScroll"
      >
        <div style="height: ${items.length * itemHeight}px; position: relative;">
          ${visibleItems.value.map((item, index) => html`
            <div 
              style="position: absolute; top: ${(startIndex.value + index) * itemHeight}px; height: ${itemHeight}px; width: 100%;"
            >
              ${item.text}
            </div>
          `)}
        </div>
      </div>
    `;
  },
});
