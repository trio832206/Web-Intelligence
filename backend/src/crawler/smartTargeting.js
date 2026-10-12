export async function randomDelay(minMs = 500, maxMs = 1500) {
  const duration = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise(resolve => setTimeout(resolve, duration));
}

export async function checkRobotsTxt(targetUrl, strictRobots = false) {
  if (!strictRobots) {
    return true; // Fail-open by default
  }

  try {
    const parsed = new URL(targetUrl);
    const robotsUrl = `${parsed.protocol}//${parsed.host}/robots.txt`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WebIntelligenceBot/1.0)' }
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return true; // Fail-open if robots.txt doesn't exist or returns 404
    }

    const text = await res.text();
    const pathname = parsed.pathname;

    // Simple parse of Disallow lines for user-agent *
    const lines = text.split('\n');
    let isApplies = false;
    for (const line of lines) {
      const trimmed = line.trim();
      if (/^User-agent:\s*\*/i.test(trimmed)) {
        isApplies = true;
        continue;
      }
      if (/^User-agent:/i.test(trimmed)) {
        isApplies = false;
        continue;
      }
      if (isApplies && /^Disallow:\s*(.*)/i.test(trimmed)) {
        const disallowPath = trimmed.replace(/^Disallow:\s*/i, '').trim();
        if (disallowPath && (pathname.startsWith(disallowPath) || disallowPath === '/')) {
          return false; // Disallowed
        }
      }
    }
    return true;
  } catch {
    // 5s timeout or network failure -> fail-open
    return true;
  }
}
