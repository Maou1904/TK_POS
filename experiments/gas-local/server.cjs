const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('../../tk_frontend/node_modules/typescript');
const { schema, instructions, validateExtraction } = require('./model.cjs');
const port = 5012;
const origin = `http://127.0.0.1:${port}`;
const model = 'qwen3:4b';
let state = 'loading';
let busy = false;
let warming;
async function ollama(route, body, timeout = 15000) {
    const response = await fetch('http://127.0.0.1:11434/api/' + route, { method: 'POST',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(timeout) });
    if (!response.ok) throw new Error('Local model unavailable');
    return response.json();
}
async function infer(text) {
    const started = performance.now();
    const result = await ollama('chat', { model, stream: false, think: false, format: schema, keep_alive: '24h',
        options: { temperature: 0, num_predict: 384, num_ctx: 4096 },
        messages: [{ role: 'system', content: instructions }, { role: 'user', content: text }] });
    return { draft: validateExtraction(JSON.parse(result.message.content), text), durationMs: Math.round(performance.now() - started) };
}
async function warm() {
    if (warming) return warming;
    state = 'loading';
    warming = (async () => {
        try {
            await ollama('generate', { model, prompt: '', stream: false, keep_alive: '24h', options: { num_ctx: 4096 } }, 60000);
            await infer('ปตท ถังใหญ่ 1 ถัง');
            state = 'ready';
            console.log('Local gas AI ready');
        } catch { state = 'error'; console.warn('Local gas AI not ready; check Ollama'); }
        finally { warming = null; }
    })();
    return warming;
}
const files = { '/': ['index.html', 'text/html'], '/client.js': ['client.js', 'text/javascript'], '/style.css': ['style.css', 'text/css'] };
const rules = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../../tk_frontend/src/gasVoice.ts'), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const server = http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'");
    const reply = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(value)); };
    if (req.headers.host !== `127.0.0.1:${port}` || (req.headers.origin && req.headers.origin !== origin)) return reply(403, { error: 'Local access only' });
    if (req.method === 'GET' && req.url === '/api/status') return reply(200, { state, model });
    if (req.method === 'GET' && req.url === '/gas-rules.js') { res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8' }); return res.end(rules); }
    if (req.method === 'GET' && files[req.url]) {
        const [file, type] = files[req.url];
        res.writeHead(200, { 'Content-Type': type + '; charset=utf-8' });
        return res.end(fs.readFileSync(path.join(__dirname, file)));
    }
    if (req.method === 'POST' && ['/api/parse', '/api/warm'].includes(req.url)) {
        if (!req.headers['content-type']?.startsWith('application/json')) return reply(415, { error: 'JSON required' });
        if (req.url === '/api/warm') { void warm(); return reply(202, { state }); }
        if (state !== 'ready') return reply(503, { error: 'โมเดลยังไม่พร้อม กดโหลดโมเดลใหม่ หรือรอสักครู่' });
        if (busy) return reply(429, { error: 'กำลังแยกข้อความก่อนหน้า กรุณารอสักครู่' });
        let body = '';
        try {
            for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 4096) return reply(413, { error: 'ข้อความยาวเกินไป' }); }
            const { text } = JSON.parse(body);
            if (typeof text !== 'string' || !text.trim() || text.length > 1000) return reply(400, { error: 'กรอกข้อความ 1–1,000 ตัวอักษร' });
            busy = true;
            try { reply(200, await infer(text.trim())); }
            finally { busy = false; }
        } catch (error) { reply(502, { error: error.code === 'VOICE_AI_INVALID' ? error.message : 'AI ในคอมตอบไม่สำเร็จ ลองอีกครั้งหรือเทียบผลจาก rules' }); }
        return;
    }
    reply(404, { error: 'Not found' });
});
server.listen(port, '127.0.0.1', () => { console.log(`Gas AI trial: ${origin}`); void warm(); });
