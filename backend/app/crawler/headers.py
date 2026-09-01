import random
from fake_useragent import UserAgent
import httpx

ua = UserAgent()

def get_random_headers():
    """Generates realistic rotating headers for scraping."""
    return {
        "User-Agent": ua.random,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
    }

def get_httpx_client(proxy_url: str = None) -> httpx.AsyncClient:
    """Returns an HTTPX AsyncClient configured for HTTP/2 and optional proxy."""
    headers = get_random_headers()
    
    return httpx.AsyncClient(
        headers=headers,
        http2=True,
        proxy=proxy_url,
        timeout=15.0,
        verify=False # Often necessary with free proxies
    )
