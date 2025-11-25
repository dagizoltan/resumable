// resumable/core/signals.js

const isServer = typeof window === 'undefined';

// --- Client-Side Reactive Implementation ---
let currentEffect = null;
let isBatching = false;
const effectsToRun = new Set();

function cleanupEffect(effect) {
  for (const dep of effect.dependencies) {
    dep.subscribers.delete(effect);
  }
  effect.dependencies.clear();
}

const clientSignal = (initialValue) => {
  const s = {
    _value: initialValue,
    subscribers: new Set(),
    get value() {
      if (currentEffect) {
        s.subscribers.add(currentEffect);
        currentEffect.dependencies.add(s);
      }
      return s._value;
    },
    set value(newValue) {
      if (newValue === s._value) return;
      s._value = newValue;
      for (const subscriber of s.subscribers) {
        if (isBatching) {
          effectsToRun.add(subscriber);
        } else {
          subscriber.run();
        }
      }
    },
  };
  return s;
};

const clientEffect = (fn) => {
  const e = {
    run: () => {
      cleanupEffect(e);
      const oldEffect = currentEffect;
      currentEffect = e;
      try {
        fn();
      } finally {
        currentEffect = oldEffect;
      }
    },
    dependencies: new Set(),
  };
  e.run();
  return e;
};

const clientComputed = (fn) => {
  const c = clientSignal(undefined);
  clientEffect(() => {
    c.value = fn();
  });
  return {
    get value() {
      return c.value;
    },
    _isComputed: true,
  };
};

const clientBatch = (fn) => {
  isBatching = true;
  try {
    fn();
  } finally {
    isBatching = false;
    for (const e of effectsToRun) {
      e.run();
    }
    effectsToRun.clear();
  }
};

const clientUntrack = (fn) => {
  const oldEffect = currentEffect;
  currentEffect = null;
  try {
    return fn();
  } finally {
    currentEffect = oldEffect;
  }
};


// --- Server-Side Mock Implementation ---
const serverSignal = (initialValue) => ({ value: initialValue });

const serverComputed = (fn) => {
  let value;
  let computed = false;
  return {
    _isComputed: true, // Keep for component logic
    _fn: fn, // Store the function for later evaluation
    get value() {
      if (!computed) {
        try {
          value = fn();
        } catch (e) {
          // Return undefined if computation fails (e.g., state not ready)
          return undefined;
        }
        computed = true;
      }
      return value;
    }
  };
};

const serverEffect = () => {};
const serverBatch = (fn) => fn();
const serverUntrack = (fn) => fn();


// --- Export the correct implementation based on the environment ---
export const signal = isServer ? serverSignal : clientSignal;
export const computed = isServer ? serverComputed : clientComputed;
export const effect = isServer ? serverEffect : clientEffect;
export const batch = isServer ? serverBatch : clientBatch;
export const untrack = isServer ? serverUntrack : clientUntrack;
