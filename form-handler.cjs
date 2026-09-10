const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function readFields(req) {
  let body = req.body;
  if (body === undefined) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += Buffer.byteLength(chunk);
      if (size > 20000) throw new Error('Request too large');
      chunks.push(Buffer.from(chunk));
    }
    body = Buffer.concat(chunks).toString('utf8');
  }
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  if (typeof body === 'string') body = Object.fromEntries(new URLSearchParams(body));
  return body && typeof body === 'object' ? body : {};
}

module.exports = function createHandler(type) {
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).send('Method Not Allowed');
    }
    try {
      const input = await readFields(req);
      const fields = type === 'contact' ? ['name', 'email', 'subject', 'message'] : ['email'];
      const data = {};
      for (const field of fields) {
        if (typeof input[field] !== 'string' || !input[field].trim()) {
          return res.status(400).send('Please complete all required fields.');
        }
        data[field] = input[field].trim();
        if (data[field].length > (field === 'message' ? 10000 : 320)) {
          return res.status(400).send('One of the fields is too long.');
        }
      }
      if (!EMAIL.test(data.email) || /[\r\n]/.test(data.email)) {
        return res.status(400).send('Please enter a valid email address.');
      }
      const to = type === 'newsletter' ? (process.env.NEWSLETTER_TO || process.env.CONTACT_TO) : process.env.CONTACT_TO;
      const webhook = type === 'newsletter' ? (process.env.NEWSLETTER_WEBHOOK_URL || process.env.CONTACT_WEBHOOK_URL) : process.env.CONTACT_WEBHOOK_URL;
      const tasks = [];
      if (webhook) tasks.push(fetch(webhook, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...data }), signal: AbortSignal.timeout(10000)
      }));
      if (process.env.RESEND_API_KEY && to) tasks.push(fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: process.env.CONTACT_FROM || 'website@7ink.com.au', to,
          reply_to: data.email,
          subject: type === 'contact' ? `Website Contact: ${data.subject.replace(/[\r\n]/g, ' ')}` : 'New Newsletter Subscription',
          text: fields.map(field => `${field}: ${data[field]}`).join('\n\n')
        }), signal: AbortSignal.timeout(10000)
      }));
      if (!tasks.length) return res.status(503).send('This form is temporarily unavailable. Please email 7InkCoAdmin@7ink.com.au.');
      const results = await Promise.allSettled(tasks);
      if (!results.some(result => result.status === 'fulfilled' && result.value.ok)) {
        return res.status(502).send('Unable to deliver your request. Please try again later.');
      }
      return res.status(200).send('OK');
    } catch {
      return res.status(400).send('Unable to process your request. Please check the form and try again.');
    }
  };
};
