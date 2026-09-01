import random
import httpx
from bs4 import BeautifulSoup
import asyncio

class ProxyManager:
    def __init__(self):
        self.proxies = []
        self._lock = asyncio.Lock()

    async def fetch_free_proxies(self):
        """Fetches a list of free proxies from a public source."""
        async with self._lock:
            try:
                # Using a generic free proxy list for demonstration
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get("https://free-proxy-list.net/")
                    response.raise_for_status()
                    
                    soup = BeautifulSoup(response.text, 'html.parser')
                    table = soup.find('table', attrs={'class': 'table table-striped table-bordered'})
                    
                    if not table:
                        return

                    new_proxies = []
                    for row in table.tbody.find_all('tr'):
                        columns = row.find_all('td')
                        if columns:
                            ip = columns[0].text
                            port = columns[1].text
                            https = columns[6].text
                            
                            # We'll prefer HTTPS if possible, but collect all
                            schema = "https" if https == "yes" else "http"
                            proxy_url = f"{schema}://{ip}:{port}"
                            new_proxies.append(proxy_url)
                    
                    self.proxies = new_proxies
            except Exception as e:
                print(f"Failed to fetch proxies: {e}")

    async def get_random_proxy(self):
        """Returns a random proxy from the pool, refreshing if empty."""
        if not self.proxies:
            await self.fetch_free_proxies()
            
        if not self.proxies:
            return None # Fallback to no proxy if fetch fails completely
            
        return random.choice(self.proxies)

    def remove_proxy(self, proxy: str):
        """Removes a dead proxy from the pool."""
        if proxy in self.proxies:
            self.proxies.remove(proxy)

# Global singleton
proxy_manager = ProxyManager()
