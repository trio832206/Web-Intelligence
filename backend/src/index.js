import './polyfill.js';

// Dynamically import server after polyfills are active
await import('./server.js');
