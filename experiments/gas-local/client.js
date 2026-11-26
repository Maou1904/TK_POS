import { parseGasVoice } from '/gas-rules.js';
const $ = id => document.getElementById(id);
const input = $('transcript');
let recognition;
let request;
let speechTimer;
let ready = false;
let lastFinal = '';
let cancelled = false;
let speechFailed = false;
function controls() {
    const locked = Boolean(recognition || request);
    input.disabled = locked;
    $('compare').disabled = locked || !input.value.trim();
    $('mic').disabled = Boolean(request) || !(window.SpeechRecognition || window.webkitSpeechRecognition);
    $('mic').textContent = recognition ? 'พูดเสร็จแล้ว' : 'แตะเพื่อพูด';
    $('mic').classList.toggle('recording', Boolean(recognition));
    $('cancel').hidden = !locked;
    $('clear').disabled = locked;
    document.querySelectorAll('[data-sample]').forEach(button => { button.disabled = locked; });
}
function render(target, draft) {
    const result = $(target);
    result.replaceChildren(); result.classList.remove('empty');
    for (const [label, value] of [
        ['ยี่ห้อ', draft.brand || 'ยังไม่ระบุ'],
        ['ขนาด / จำนวน', draft.items.map(item => `${item.sizeKg ? item.sizeKg + ' กก.' : 'ยังไม่ระบุขนาด'} × ${item.quantity ?? 1} ถัง${item.quantity ? '' : ' (ค่าเริ่มต้น)'}`).join('\n') || 'ยังไม่ระบุ'],
        ['ชื่อลูกค้า', draft.customerName || 'เว้นว่าง'], ['จุดส่ง', draft.address || 'เว้นว่าง'], ['เบอร์โทร', draft.phone || 'เว้นว่าง'],
    ]) {
        const row = document.createElement('div'); row.className = 'field-row';
        const key = document.createElement('span'); key.textContent = label;
        const content = document.createElement('strong'); content.textContent = value;
        row.append(key, content); result.append(row);
    }
    if (draft.errors.length || draft.notes.length) {
        const notice = document.createElement('p'); notice.className = 'notice'; notice.textContent = [...draft.errors, ...draft.notes].join('\n'); result.append(notice);
    }
}
async function compare() {
    if (request || recognition || !input.value.trim()) return;
    const text = input.value.trim();
    const started = performance.now(); render('rules-result', parseGasVoice(text));
    $('rules-time').textContent = `${(performance.now() - started).toFixed(1)} ms`;
    if (!ready) { $('feedback').textContent = 'แสดงผล rules แล้ว · รอ AI พร้อม หรือกดโหลดโมเดลใหม่'; return; }
    const controller = new AbortController(); request = controller; controls();
    $('feedback').textContent = 'AI ในคอมกำลังแยกข้อความ…'; $('ai-time').textContent = 'กำลังวัดเวลา…';
    try {
        const response = await fetch('/api/parse', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }), signal: AbortSignal.any([controller.signal, AbortSignal.timeout(18000)]) });
        const data = await response.json(); if (controller.signal.aborted) return;
        if (!response.ok) throw new Error(data.error);
        render('ai-result', data.draft); $('ai-time').textContent = `${(data.durationMs / 1000).toFixed(2)} วินาที`;
        $('feedback').textContent = 'แยกข้อความแล้ว ลองเทียบขนาด จำนวน ชื่อ และจุดส่งทั้งสองฝั่ง';
    } catch (error) {
        if (controller.signal.aborted) return;
        $('ai-time').textContent = 'ไม่สำเร็จ'; $('feedback').textContent = error.name === 'TimeoutError' ? 'AI ตอบไม่ทัน ลองอีกครั้งหลังโหลดโมเดลพร้อม' : error.message;
        $('ai-result').replaceChildren(); $('ai-result').textContent = 'รอทดลองใหม่ · ดูผล rules ด้านขวาได้'; $('ai-result').classList.add('empty');
    } finally { if (request === controller) request = null; controls(); }
}
function cancel() {
    cancelled = true; speechFailed = true; request?.abort(); request = null;
    if (recognition) { const current = recognition; recognition = null; current.onend = null; current.onerror = null; current.onresult = null; current.abort(); }
    clearTimeout(speechTimer); controls(); $('feedback').textContent = 'ยกเลิกแล้ว';
}
function startSpeech() {
    if (recognition) { recognition.stop(); return; }
    const Constructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Constructor) return;
    const current = new Constructor(); recognition = current; cancelled = false; speechFailed = false; lastFinal = ''; input.value = '';
    current.lang = 'th-TH'; current.continuous = false; current.interimResults = true;
    current.onresult = event => {
        const final = [], interim = [];
        for (const result of event.results) (result.isFinal ? final : interim).push(result[0].transcript);
        lastFinal = final.join(' '); input.value = [...final, ...interim].join(' ');
    };
    current.onerror = event => { speechFailed = true; $('feedback').textContent = event.error === 'not-allowed' ? 'ยังไม่ได้อนุญาตไมค์ ใช้ช่องพิมพ์ทดลองได้' : `รับเสียงไม่สำเร็จ (${event.error}) ลองใหม่หรือพิมพ์ข้อความ`; };
    current.onend = () => {
        if (recognition !== current) return;
        clearTimeout(speechTimer); recognition = null; controls();
        if (!cancelled && !speechFailed && lastFinal) { input.value = lastFinal; void compare(); }
        else if (!speechFailed && !cancelled) $('feedback').textContent = 'ยังไม่ได้ข้อความ ลองพูดใหม่หรือพิมพ์เองได้';
    };
    try { current.start(); $('feedback').textContent = 'กำลังฟัง… บอกยี่ห้อ ขนาด จำนวน และจุดส่ง'; speechTimer = setTimeout(() => current.stop(), 25000); }
    catch { recognition = null; $('feedback').textContent = 'เริ่มรับเสียงไม่ได้ ลองพิมพ์ข้อความด้านล่าง'; }
    controls();
}
async function status() {
    try {
        const response = await fetch('/api/status'); const data = await response.json(); ready = data.state === 'ready';
        $('model-status').textContent = ready ? 'AI ในคอมพร้อมใช้งาน' : data.state === 'loading' ? 'กำลังเตรียมโมเดล…' : 'โมเดลยังไม่พร้อม';
        $('dot').className = `dot ${ready ? 'ready' : data.state === 'error' ? 'error' : ''}`;
    } catch { ready = false; $('model-status').textContent = 'เชื่อมต่อหน้าทดลองไม่ได้'; }
}
input.addEventListener('input', controls);
$('mic').addEventListener('click', startSpeech);
$('compare').addEventListener('click', compare);
$('cancel').addEventListener('click', cancel);
$('warm').addEventListener('click', async () => { await fetch('/api/warm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); void status(); });
$('clear').addEventListener('click', () => { input.value = ''; controls(); input.focus(); });
document.querySelectorAll('[data-sample]').forEach(button => button.addEventListener('click', () => { input.value = button.dataset.sample; controls(); }));
document.addEventListener('visibilitychange', () => { if (document.hidden && (recognition || request)) cancel(); });
window.addEventListener('pagehide', cancel);
controls(); void status(); setInterval(status, 3000);
