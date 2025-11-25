
export function serializeState(componentInstance) {
  const state = {};
  for (const key in componentInstance._state) {
    // Use peek() to get the value without subscribing to the signal
    state[key] = componentInstance._state[key].peek();
  }
  return JSON.stringify(state);
}

export function generateHandlerManifest(componentInstance) {
  const handlers = {};
  for (const key in componentInstance._actions) {
    if (typeof componentInstance._actions[key] === 'function') {
      handlers[key] = key; // In a real system, this might be a path to the handler module
    }
  }
  return JSON.stringify(handlers);
}
