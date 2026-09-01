from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re

analyzer = SentimentIntensityAnalyzer()

def analyze_text(text: str) -> dict:
    """
    AI & NLP Processing Layer.
    Uses lightweight NLP (VADER) for sentiment and basic regex heuristics for NER.
    """
    if not text:
        return {
            "sentiment_score": 0.0,
            "sentiment_label": "Neutral",
            "entities": []
        }
        
    # 1. Sentiment Analysis
    scores = analyzer.polarity_scores(text)
    polarity = scores['compound']
    
    if polarity >= 0.05:
        sentiment_label = "Positive"
    elif polarity <= -0.05:
        sentiment_label = "Negative"
    else:
        sentiment_label = "Neutral"
        
    # 2. Named Entity Recognition (NER)
    capitalized_words = re.findall(r'\b[A-Z][a-z]+\b', text)
    stop_words = {"The", "A", "An", "In", "On", "At", "To", "From", "By", "With", "This", "That", "It", "Is", "And", "Or", "For"}
    entities = list(set([word for word in capitalized_words if word not in stop_words]))
    
    return {
        "sentiment_score": polarity,
        "sentiment_label": sentiment_label,
        "entities": entities[:8] # limit to top 8
    }
