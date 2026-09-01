import scrapy

class BaseSpider(scrapy.Spider):
    name = "base_spider"
    
    def start_requests(self):
        urls = [
            'http://example.com',
        ]
        for url in urls:
            yield scrapy.Request(url=url, callback=self.parse)

    def parse(self, response):
        yield {
            'url': response.url,
            'title': response.css('title::text').get(),
            'body': response.css('body').get(),
        }
