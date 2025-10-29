const axios = require('axios');

const apiKey = process.env.OPENAI_API_KEY;

async function chatCompletion(message, opts = {}) {
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');
  const payload = {
    model: opts.model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: opts.system || 'You are a helpful academic assistant.' },
      { role: 'user', content: message }
    ],
    max_tokens: opts.max_tokens || 600
  };

  const res = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  return res.data;
}

module.exports = { chatCompletion };
