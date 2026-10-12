import nodeCrypto from 'node:crypto';

/**
 * Robust UUIDv4 generator using native Node.js crypto module.
 * Completely immune to "crypto is not defined" errors.
 */
export function uuidv4() {
  if (nodeCrypto.randomUUID) {
    return nodeCrypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
