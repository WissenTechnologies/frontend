// Setup localStorage polyfill for Jest tests
Object.defineProperty(window, 'localStorage', {
  value: (() => {
    let store: { [key: string]: string | null } = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; }
    };
  })(),
  writable: true
});
