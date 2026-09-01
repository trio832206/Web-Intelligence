import asyncio
from bs4 import BeautifulSoup
from sqlalchemy.orm import Session
from playwright.async_api import async_playwright

from ..database import CrawlJob, ExtractedEntity, SessionLocal
from .headers import get_httpx_client
from .proxy import proxy_manager
from .smart_targeting import check_robots_txt, random_delay

async def fetch_with_playwright(url: str, proxy: str = None) -> str:
    """Uses Playwright for headless browsing to fetch JS-rendered content."""
    async with async_playwright() as p:
        browser_kwargs = {}
        if proxy:
            # Playwright proxy format
            browser_kwargs["proxy"] = {"server": proxy}
            
        browser = await p.chromium.launch(headless=True, **browser_kwargs)
        page = await browser.new_page()
        
        # Block unnecessary resources to save bandwidth
        async def block_resources(route):
            if route.request.resource_type in ["image", "stylesheet", "media", "font"]:
                await route.abort()
            else:
                await route.continue_()
        
        await page.route("**/*", block_resources)
        
        await page.goto(url, wait_until="networkidle", timeout=20000)
        html = await page.content()
        await browser.close()
        return html

async def execute_crawl(job_id: str, url: str, depth: int, use_browser: bool = False, strict_robots: bool = False):
    # In a background task, we create a new session
    db: Session = SessionLocal()
    try:
        job = db.query(CrawlJob).filter(CrawlJob.id == job_id).first()
        if not job:
            return
        
        job.status = "running"
        db.commit()

        # 1. Smart Targeting: Check robots.txt
        is_allowed = check_robots_txt(url)
        if not is_allowed:
            if strict_robots:
                print(f"Skipping {url} as per robots.txt strict rules.")
                job.status = "failed (blocked by robots.txt)"
                db.commit()
                return
            else:
                print(f"Warning: {url} is forbidden by robots.txt, but strict mode is off. Proceeding...")

        # 2. Request Throttling: Random delay before request
        await random_delay()

        # 3. Proxy Rotation: Get a random proxy
        proxy_url = await proxy_manager.get_random_proxy()
        if proxy_url:
            print(f"Using proxy: {proxy_url}")
            
        html = ""
        try:
            # 4. Fetch content either via Headless Browser or Fast HTTPX
            if use_browser:
                print(f"Fetching {url} using Playwright (Headless Browser)")
                html = await fetch_with_playwright(url, proxy_url)
            else:
                print(f"Fetching {url} using HTTPX (HTTP/2, Multiplexed)")
                async with get_httpx_client(proxy=proxy_url) as client:
                    response = await client.get(url)
                    response.raise_for_status()
                    html = response.text
            
            # Parse Data
            from .parser import parse_html
            from ..nlp.analyzer import analyze_text
            import json
            
            parsed_data = parse_html(html, url)
            
            # NLP Analysis
            nlp_data = analyze_text(parsed_data["snippet"])
            
            entity = ExtractedEntity(
                job_id=job.id,
                title=parsed_data["title"],
                url=url,
                content_snippet=parsed_data["snippet"],
                sentiment_score=nlp_data["sentiment_score"],
                sentiment_label=nlp_data["sentiment_label"],
                named_entities=json.dumps(nlp_data["entities"]),
                structured_data=json.dumps(parsed_data["structured_data"])
            )
            db.add(entity)
            
            # Evaluate Alerts
            from ..database import AlertRule, AlertNotification
            active_rules = db.query(AlertRule).filter(AlertRule.is_active == 1).all()
            for rule in active_rules:
                trigger = False
                if rule.sentiment_threshold and rule.sentiment_threshold.lower() == nlp_data["sentiment_label"].lower():
                    trigger = True
                if rule.keyword and rule.keyword.lower() in parsed_data["snippet"].lower():
                    trigger = True
                    
                if trigger:
                    notification = AlertNotification(
                        rule_id=rule.id,
                        entity_id=entity.id,
                        message=f"Alert '{rule.name}' triggered on URL {url}"
                    )
                    db.add(notification)
            
            if depth > 1:
                # Add links to the DB as pending jobs (recursive crawling)
                for link in parsed_data["links"][:3]: # Limit to 3 branches to avoid explosion
                    new_job = CrawlJob(url=link, depth=depth-1, status="pending")
                    db.add(new_job)
                    db.commit()
                    # We could trigger the background task here or have a scheduler pick it up
                    # For simplicity, we just add it to DB and it would be picked up if we had a worker polling.
            
            job.status = "completed"
            
        except Exception as e:
            print(f"Error crawling {url}: {e}")
            job.status = "failed"
            if proxy_url:
                proxy_manager.remove_proxy(proxy_url)
                
        db.commit()
    finally:
        db.close()

