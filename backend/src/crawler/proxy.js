import dotenv from 'dotenv';
dotenv.config();

class ProxyManager {
  constructor() {
    const rawList = process.env.PROXY_LIST || '';
    this.proxies = rawList
      .split(',')
      .map(p => p.trim())
      .filter(p => p.startsWith('http://') || p.startsWith('https://'));
  }

  getRandomProxy() {
    if (this.proxies.length === 0) {
      return null;
    }
    const idx = Math.floor(Math.random() * this.proxies.length);
    return this.proxies[idx];
  }
}

export const proxyManager = new ProxyManager();
