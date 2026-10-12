// VADER-style sentiment lexicon and intensity multipliers
const VADER_LEXICON = {
  // Positive
  great: 3.1, good: 1.9, excellent: 3.3, best: 3.2, love: 3.2, amazing: 3.4, awesome: 3.1,
  fantastic: 3.2, wonderful: 3.0, super: 2.9, incredible: 3.0, outstanding: 3.1, superior: 2.8,
  innovative: 2.7, premium: 2.5, perfect: 3.0, top: 2.2, reliable: 2.4, durable: 2.2,
  comfortable: 2.4, efficient: 2.3, powerful: 2.4, breakthrough: 2.9, impressive: 2.6,
  recommend: 2.5, fast: 1.8, secure: 2.1, trusted: 2.4, value: 1.8, advanced: 2.0,
  pro: 1.9, positive: 2.0, benefit: 1.9, win: 2.4, leading: 2.2, high: 1.5,
  // Negative
  bad: -2.5, terrible: -3.0, awful: -3.1, worst: -3.4, hate: -3.2, poor: -2.2,
  horrible: -3.2, broken: -2.5, defect: -2.8, flawed: -2.3, failure: -2.7, fail: -2.4,
  cheap: -1.8, fragile: -2.1, scam: -3.5, fake: -3.0, dangerous: -3.0, slow: -1.7,
  vulnerable: -2.5, critical: -2.0, problem: -1.8, bug: -2.0, crash: -2.6, breach: -3.2,
  expensive: -1.6, delay: -1.7, negative: -2.0, issue: -1.5, risk: -2.1, harm: -2.8,
  error: -2.0, low: -1.3, warning: -1.9, fraud: -3.4, decline: -2.0, lost: -2.1
};

const NEGATIONS = new Set(['not', 'no', 'never', 'neither', 'hardly', 'barely', 'scarcely', "don't", "didn't", "wasn't", "isn't", "aren't"]);
const BOOSTER_WORDS = {
  very: 0.293, extremely: 0.385, really: 0.25, especially: 0.27, highly: 0.3,
  completely: 0.33, absolutely: 0.35, somewhat: -0.15, slightly: -0.2
};

const STOP_WORDS = new Set([
  'A', 'About', 'Above', 'After', 'Again', 'Against', 'All', 'Also', 'Am', 'An', 'And', 'Any', 'Are',
  'Aren', 'As', 'At', 'Be', 'Because', 'Been', 'Before', 'Being', 'Below', 'Between', 'Both', 'But',
  'By', 'Can', 'Cannot', 'Could', 'Did', 'Do', 'Does', 'Doing', 'Don', 'Down', 'During', 'Each',
  'Few', 'For', 'From', 'Further', 'Had', 'Has', 'Have', 'Having', 'He', 'Her', 'Here', 'Hers',
  'Herself', 'Him', 'Himself', 'His', 'How', 'If', 'In', 'Into', 'Is', 'Isn', 'It', 'Its', 'Itself',
  'Let', 'Me', 'More', 'Most', 'My', 'Myself', 'No', 'Nor', 'Not', 'Of', 'Off', 'On', 'Once',
  'Only', 'Or', 'Other', 'Ought', 'Our', 'Ours', 'Ourselves', 'Out', 'Over', 'Own', 'Same', 'She',
  'Should', 'So', 'Some', 'Such', 'Than', 'That', 'The', 'Their', 'Theirs', 'Them', 'Themselves',
  'Then', 'There', 'These', 'They', 'This', 'Those', 'Through', 'To', 'Too', 'Under', 'Until', 'Up',
  'Very', 'Was', 'Wasn', 'We', 'Were', 'What', 'When', 'Where', 'Which', 'While', 'Who', 'Whom',
  'Why', 'With', 'Would', 'You', 'Your', 'Yours', 'Yourself', 'Yourselves',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December',
  'Home', 'Page', 'Menu', 'Sign', 'Login', 'Contact', 'About', 'Privacy', 'Policy', 'Terms', 'Search', 'Read', 'More'
]);

export function calculateSentiment(text) {
  if (!text || typeof text !== 'string') {
    return { score: 0.0, label: 'Neutral' };
  }

  const words = text.toLowerCase().match(/\b[a-z']+\b/g) || [];
  if (words.length === 0) {
    return { score: 0.0, label: 'Neutral' };
  }

  let totalScore = 0;
  let scoredWords = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let score = VADER_LEXICON[word];

    if (score !== undefined) {
      // Check prior words for booster or negation
      if (i > 0) {
        const prev = words[i - 1];
        if (NEGATIONS.has(prev)) {
          score = score * -0.74;
        } else if (BOOSTER_WORDS[prev]) {
          score += (score > 0 ? 1 : -1) * BOOSTER_WORDS[prev];
        }
      }
      totalScore += score;
      scoredWords++;
    }
  }

  // Compound score normalization: score / sqrt(score^2 + alpha), alpha=15
  const alpha = 15;
  const rawSum = totalScore;
  const compound = rawSum === 0 ? 0 : rawSum / Math.sqrt(rawSum * rawSum + alpha);
  const roundedScore = Math.round(compound * 100) / 100;

  // Thresholds: >= 0.05 Positive, <= -0.05 Negative
  let label = 'Neutral';
  if (roundedScore >= 0.05) {
    label = 'Positive';
  } else if (roundedScore <= -0.05) {
    label = 'Negative';
  }

  return {
    score: roundedScore,
    label
  };
}

export function extractNamedEntities(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Regex \b[A-Z][a-z]+\b with stop-word filter
  const matches = text.match(/\b[A-Z][a-z]{2,}\b/g) || [];
  const freqMap = new Map();

  for (const token of matches) {
    if (!STOP_WORDS.has(token)) {
      freqMap.set(token, (freqMap.get(token) || 0) + 1);
    }
  }

  // Sort descending by frequency and return top 8
  const sorted = Array.from(freqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(entry => entry[0]);

  return sorted;
}

export function analyzeText(text) {
  const sentiment = calculateSentiment(text);
  const entities = extractNamedEntities(text);

  return {
    sentiment_score: sentiment.score,
    sentiment_label: sentiment.label,
    named_entities: entities
  };
}
