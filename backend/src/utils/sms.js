/**
 * utils/sms.js
 * Sends OTP codes via TextBelt (free SMS REST API – no SDK, no Twilio).
 *
 * Free tier  : use key "textbelt"  → 1 SMS per day (testing only)
 * Paid usage : buy credits at https://textbelt.com  → set TEXTBELT_KEY in .env
 *
 * Required env vars:
 *   TEXTBELT_KEY   – API key. Leave blank or set to "textbelt" for free tier.
 *
 * Phone numbers must be in E.164 format, e.g. +919876543210
 */

const TEXTBELT_ENDPOINT = 'https://textbelt.com/text';
const TEXTBELT_KEY = process.env.TEXTBELT_KEY || 'textbelt'; // 'textbelt' = free tier

/**
 * Send an OTP via TextBelt SMS API.
 *
 * @param {string} phone   - Phone number in E.164 format (+CountryCodeNumber)
 * @param {string} message - Text message body
 */
export async function sendSMS(phone, message) {
  if (!phone || !message) return;

  try {
    const res = await fetch(TEXTBELT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        message,
        key: TEXTBELT_KEY,
      }),
    });

    const data = await res.json();

    if (data.success) {
      console.log(`[SMS] Sent to ${phone} | textId: ${data.textId} | quota remaining: ${data.quotaRemaining}`);
    } else {
      // API responded but delivery failed – log and fall through to dev fallback
      console.warn(`[SMS] TextBelt failed: ${data.error}`);
      _devFallback(phone, message);
    }
  } catch (err) {
    // Network error – never crash the server, just log
    console.error('[SMS] TextBelt request error:', err.message);
    _devFallback(phone, message);
  }
}

function _devFallback(phone, message) {
  console.log('\n[SMS Dev Fallback] ─────────────────────────');
  console.log(`  To     : ${phone}`);
  console.log(`  Message: ${message}`);
  console.log('────────────────────────────────────────────\n');
}
