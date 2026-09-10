const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const createHandler = require('./form-handler.cjs');
const originalFetch = global.fetch;
const keys = ['RESEND_API_KEY','CONTACT_TO','CONTACT_FROM','CONTACT_WEBHOOK_URL','NEWSLETTER_TO','NEWSLETTER_WEBHOOK_URL'];
const saved = Object.fromEntries(keys.map(k => [k, process.env[k]]));
afterEach(() => { global.fetch = originalFetch; for (const k of keys) { if(saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } });
async function run(type, body, stream = false) {
  for (const k of keys) delete process.env[k];
  const req = stream ? Readable.from([body]) : { body };
  req.method = 'POST';
  const res = { setHeader() {}, status(code) { this.code = code; return this; }, send(text) { this.text = text; return this; } };
  return {req, res, invoke: () => createHandler(type)(req,res)};
}
test('missing delivery configuration never reports success', async () => {
 const t = await run('newsletter',{email:'visitor@example.com'}); await t.invoke(); assert.equal(t.res.code,503);
});
test('parsed Vercel contact body delivers text with reply address', async () => {
 const t = await run('contact',{name:'<b>Visitor</b>',email:'visitor@example.com',subject:'Hello',message:'Test'});
 process.env.RESEND_API_KEY='test'; process.env.CONTACT_TO='owner@example.com';
 let payload; global.fetch=async(url,opts)=>{payload=JSON.parse(opts.body);return {ok:true};};
 await t.invoke(); assert.equal(t.res.code,200); assert.equal(payload.reply_to,'visitor@example.com'); assert.equal(payload.html,undefined); assert.match(payload.text,/<b>Visitor/);
});
test('raw URL encoded stream and newsletter webhook work',async()=>{
 const t=await run('newsletter','email=visitor%40example.com',true);process.env.NEWSLETTER_WEBHOOK_URL='https://example.com';
 global.fetch=async()=>({ok:true});await t.invoke();assert.equal(t.res.text,'OK');
});
test('URL encoded parsed body works',async()=>{
 const t=await run('newsletter','email=visitor%40example.com');process.env.CONTACT_WEBHOOK_URL='https://example.com';global.fetch=async()=>({ok:true});await t.invoke();assert.equal(t.res.code,200);
});
test('invalid email rejected before delivery',async()=>{
 const t=await run('newsletter',{email:'invalid'});global.fetch=()=>{throw Error('must not send');};await t.invoke();assert.equal(t.res.code,400);
});
test('delivery failure never reports success',async()=>{
 const t=await run('newsletter',{email:'visitor@example.com'});process.env.CONTACT_WEBHOOK_URL='https://example.com';global.fetch=async()=>({ok:false});await t.invoke();assert.equal(t.res.code,502);
});
