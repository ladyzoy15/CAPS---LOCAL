const originalFetch = window.fetch;

window.fetch = function (input, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("ngrok-skip-browser-warning", "true");
  return originalFetch(input, { ...init, headers });
};
