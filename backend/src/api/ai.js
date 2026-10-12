import express from 'express';
import { bayekChat } from '../ai/gemini.js';

export const aiRouter = express.Router();

// POST /api/v1/ai/bayek
aiRouter.post('/bayek', async (req, res) => {
  const { message, currentRoute, pageContext, detectedErrors } = req.body || {};

  try {
    const reply = await bayekChat({
      message: message || '',
      currentRoute: currentRoute || '/',
      pageContext: pageContext || {},
      detectedErrors: detectedErrors || []
    });

    res.json({
      reply,
      speaker: 'Bayek of Siwa',
      role: 'Medjay Guardian & Platform Tutor'
    });
  } catch (err) {
    console.error('[Bayek Router Error]', err);
    res.status(500).json({ error: 'Bayek is momentarily observing the horizon. Try again shortly.' });
  }
});
