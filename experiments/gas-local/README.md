# Local gas AI trial

Run from the root workspace:

```powershell
node experiments/gas-local/server.cjs
```

Open http://127.0.0.1:5012 on this PC. Ollama must be running with `qwen3:4b`
downloaded. The page compares local inference with the existing shop rule parser.
It never connects to the production API or writes a sale. The listener and Ollama
both stay on loopback; there is no inbound public port or tunnel.

The local model shares the current backend output validator, and uses the same
bounded extraction schema/prompt. Browser speech recognition is separate and may
use the browser provider's online speech service. Displayed timings cover text
extraction only. Startup may take longer while the model loads and warms up.

Synthetic smoke test: `node experiments/gas-local/benchmark.cjs`.
On RTX 5070, the initial warm test of five orders took 292–637 ms per extraction.
This is a small local test, not a guarantee for all input or other hardware.

The comparison page remains a loopback-only trial. Production local inference is
now implemented separately in `tk_backend/scripts/gas-voice-worker.cjs`; see
`tk_backend/LOCAL-GAS-AI.md` for signed relay, Windows startup and fallback.
