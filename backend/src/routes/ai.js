// backend/src/routes/ai.js
import express from 'express';
import auth from '../middleware/auth.js';
import User from '../models/User.js';
import Event from '../models/Event.js';
import Service from '../models/Service.js';

const router = express.Router();

// Simple semantic-ish search using regex over key fields
router.get('/search', async (req, res) => {
  try {
    const q = (req.query.query || '').toString().trim();
    const sport = (req.query.sport || '').toString().trim();
    const regex = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;
    const sportRegex = sport ? new RegExp(sport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;

    const eventQuery = { status: 'published' };
    if (regex) {
      eventQuery.$or = [
        { title: regex },
        { description: regex },
        { 'location.city': regex },
        { 'location.name': regex },
      ];
    }
    if (sportRegex) {
      // Events schema doesn't include explicit sport field in this version; match title/description
      eventQuery.$or = (eventQuery.$or || []).concat([{ title: sportRegex }, { description: sportRegex }]);
    }

    const serviceQuery = {};
    if (regex) {
      serviceQuery.$or = [
        { name: regex },
        { description: regex },
        { category: regex },
        { sport: regex },
      ];
    }
    if (sportRegex) {
      (serviceQuery.$or = serviceQuery.$or || []).push({ sport: sportRegex });
    }

    const userQuery = {};
    if (regex) {
      userQuery.$or = [
        { username: regex },
        { favoriteSports: regex },
      ];
    }
    if (sportRegex) {
      (userQuery.$or = userQuery.$or || []).push({ favoriteSports: sportRegex });
    }

    const [events, services, users] = await Promise.all([
      Event.find(eventQuery).limit(5),
      Service.find(serviceQuery).limit(5),
      User.find(userQuery).select('username avatar favoriteSports').limit(5),
    ]);

    res.json({ ok: true, events, services, users });
  } catch (e) {
    console.error('[AI SEARCH] error', e);
    res.status(500).json({ error: 'search_failed', details: e.message });
  }
});

// Chat assistant backed by OpenAI; falls back to local guidance if no API key
router.post('/assistant', auth, async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'invalid_message' });
    }

    const userId = req.user?.id || req.user?._id;
    const me = userId ? await User.findById(userId).select('username favoriteSports') : null;

    const system = [
      'You are Auralink Assistant, a concise in-app guide.',
      'Help with: finding sports events, services, marketplace items, and community connections.',
      'Prefer short, actionable answers. Offer 2-3 follow-up suggestions.',
      'When asked to find, propose filters (sport, city, free/paid) and next clicks.',
    ].join(' ');

    const context = {
      username: me?.username,
      favoriteSports: me?.favoriteSports || [],
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback local reply
      const suggestions = [];
      if (context.favoriteSports?.length) {
        suggestions.push(`Try: Find ${context.favoriteSports[0]} events near me`);
      }
      suggestions.push('Browse services (physiotherapy, coaching, nutrition)');
      suggestions.push('Open Discover and pick Sports or Marketplace');
      return res.json({
        ok: true,
        reply: `Hi${context.username ? ' ' + context.username : ''}! I can help you find events, services, and people. Tell me a sport or city.`,
        suggestions,
      });
    }

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `User context: ${JSON.stringify(context)}. Query: ${message}` },
      ],
      temperature: 0.3,
    };

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[AI ASSISTANT] OpenAI error', resp.status, errText);
      return res.status(500).json({ error: 'assistant_failed', details: errText });
    }

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
    res.json({ ok: true, reply });
  } catch (e) {
    console.error('[AI ASSISTANT] error', e);
    res.status(500).json({ error: 'assistant_error', details: e.message });
  }
});

export default router;
