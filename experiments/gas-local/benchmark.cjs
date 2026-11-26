// Explicit local-model smoke test; synthetic orders only, no shop/API writes.
const assert = require('node:assert/strict');
const { schema, instructions, validateExtraction } = require('./model.cjs');
const endpoint = 'http://127.0.0.1:11434';
const model = 'qwen3:4b';
const cases = [
    { text: 'ส่งปตทถังใหญ่ 1 ถังให้คุณเจเจที่ดอนภูตา', name: 'คุณเจเจ', address: 'ดอนภูตา', items: [{ sizeKg: 15, quantity: 1 }] },
    { text: 'ปตท ถังใหญ่ 4 ถัง ส่งร้านป้าตุ้ม', name: 'ร้านป้าตุ้ม', address: 'ร้านป้าตุ้ม', items: [{ sizeKg: 15, quantity: 4 }], allowName: 'ป้าตุ้ม' },
    { text: 'ปตท ถังใหญ่ 2 ถัง ถังเล็ก 1 ถัง ส่งที่หลังวัด', name: 'หลังวัด', address: 'หลังวัด', items: [{ sizeKg: 15, quantity: 2 }, { sizeKg: 4, quantity: 1 }] },
    { text: 'ปตท ถังใหญ่ 1 ถัง', name: undefined, address: undefined, items: [{ sizeKg: 15, quantity: 1 }] },
    { text: 'ปตท ถังใหญ่กับถังเล็กอย่างละ 2 ถัง ลูกค้าคุณสมชาย ส่งที่อู่ช่างชัย', name: 'คุณสมชาย', address: 'อู่ช่างชัย', items: [{ sizeKg: 15, quantity: 2 }, { sizeKg: 4, quantity: 2 }] },
];
(async () => {
    const warm = await fetch(endpoint + '/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, prompt: '', stream: false, keep_alive: '24h', options: { num_ctx: 4096 } }), signal: AbortSignal.timeout(60000) });
    assert(warm.ok, 'Ollama must be installed and model downloaded');
    await warm.json();
    for (const [index, sample] of cases.entries()) {
        const started = Date.now();
        const response = await fetch(endpoint + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, stream: false, think: false, format: schema, keep_alive: '24h',
                options: { temperature: 0, num_predict: 384, num_ctx: 4096 },
                messages: [{ role: 'system', content: instructions }, { role: 'user', content: sample.text }] }), signal: AbortSignal.timeout(15000) });
        assert(response.ok, 'Local inference must succeed');
        const result = await response.json();
        const draft = validateExtraction(JSON.parse(result.message.content), sample.text);
        assert.equal(draft.brand, 'ปตท');
        assert.deepEqual(draft.items.sort((a, b) => a.sizeKg - b.sizeKg), [...sample.items].sort((a, b) => a.sizeKg - b.sizeKg));
        assert([sample.name, sample.allowName].includes(draft.customerName), 'Customer name must match');
        assert.equal(draft.address, sample.address);
        assert.deepEqual(draft.errors, []);
        console.log(JSON.stringify({ case: index + 1, durationMs: Date.now() - started, outputTokens: result.eval_count, passed: true }));
    }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
