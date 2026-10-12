import { Blob } from 'node:buffer';
import nodeCrypto from 'node:crypto';

// Polyfill global crypto for Node.js 18 (undici, uuid, and webcrypto)
if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = nodeCrypto.webcrypto || nodeCrypto;
}
if (typeof global.crypto === 'undefined') {
  global.crypto = nodeCrypto.webcrypto || nodeCrypto;
}

// Node.js 18 File API polyfill for undici/fetch
if (typeof globalThis.File === 'undefined') {
  class File extends Blob {
    constructor(chunks, filename, options = {}) {
      super(chunks, options);
      this.name = String(filename || 'file');
      this.lastModified = options?.lastModified || Date.now();
    }
  }
  globalThis.File = File;
}
