from bs4 import BeautifulSoup
from urllib.parse import urljoin
import json

def parse_html(html_content: str, url: str) -> dict:
    """
    Intelligent Data Extraction module.
    Attempts to parse common structured data like prices, ratings, and authors.
    """
    soup = BeautifulSoup(html_content, "html.parser")
    
    # Generic intelligent extraction using common CSS classes/attributes
    structured_data = {}
    
    # Price
    price_elem = soup.find(class_=["price", "product-price", "offer-price"])
    if price_elem:
        structured_data["price"] = price_elem.get_text(strip=True)
        
    # Author/Brand
    author_elem = soup.find(class_=["author", "brand", "byline"])
    if author_elem:
        structured_data["author_brand"] = author_elem.get_text(strip=True)
        
    # Rating
    rating_elem = soup.find(class_=["rating", "stars", "review-score"])
    if rating_elem:
        structured_data["rating"] = rating_elem.get_text(strip=True)
        
    # Title
    title = soup.title.string if soup.title else "No Title"
    
    # Snippet (first 3 paragraphs)
    paragraphs = soup.find_all('p')
    snippet = " ".join([p.get_text(strip=True) for p in paragraphs[:3]])
    if len(snippet) > 200:
        snippet = snippet[:200] + "..."
        
    # Find links for recursive crawling
    links = []
    for a in soup.find_all('a', href=True):
        href = a.get('href', '')
        if href.startswith('http'):
            links.append(href)
        elif href.startswith('/'):
            links.append(urljoin(url, href))
            
    # Deduplicate links
    links = list(set(links))
    
    return {
        "title": title.strip() if title else "",
        "snippet": snippet,
        "structured_data": structured_data,
        "links": links
    }
