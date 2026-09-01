import urllib.robotparser
import urllib.parse
import asyncio
import random

def check_robots_txt(url: str, user_agent: str = "*") -> bool:
    """
    Checks robots.txt for the given URL to see if crawling is allowed.
    Returns True if allowed, False if forbidden.
    """
    try:
        parsed_url = urllib.parse.urlparse(url)
        base_url = f"{parsed_url.scheme}://{parsed_url.netloc}"
        robots_url = f"{base_url}/robots.txt"
        
        rp = urllib.robotparser.RobotFileParser()
        rp.set_url(robots_url)
        rp.read()
        
        return rp.can_fetch(user_agent, url)
    except Exception as e:
        print(f"Error checking robots.txt for {url}: {e}")
        # If we can't fetch robots.txt, we assume it's allowed
        return True

async def random_delay(min_seconds: float = 1.0, max_seconds: float = 3.0):
    """
    Introduces a random sleep delay to throttle requests and mimic human behavior.
    """
    delay = random.uniform(min_seconds, max_seconds)
    print(f"Throttling request: sleeping for {delay:.2f} seconds...")
    await asyncio.sleep(delay)
