# Security model

## Code runner

User TypeScript and JavaScript never reaches the Node.js API. It is compiled and executed in a fresh browser Web Worker for each run.

- The worker has no DOM, cookies, or local storage.
- Network APIs, external imports, nested workers, and external scripts are blocked.
- Source size is capped at 50,000 characters.
- Console output is capped at 200 entries and 4,000 characters per entry.
- The parent page allows up to 20 seconds for the worker bundle to start and terminates compilation or execution after 15 seconds, including when an infinite loop blocks the worker event loop.
- The main document keeps `unsafe-eval` disabled. Production CSP enables it only on the hashed code-runner Worker response because that isolated Worker must evaluate the transpiled user program.
- Origin-keyed agent clusters are disabled because the application does not depend on them and supports plain HTTP/IP deployments where cluster-mode history can otherwise produce inconsistent browser warnings.

This protects the server and limits accidental browser lockups. A browser worker is not a multi-tenant hostile-code container: untrusted public users can still attempt short CPU or memory spikes in their own browser process. Do not move code execution to the API process. If server-side execution is added later, use isolated disposable containers or microVMs with CPU, memory, process, filesystem, and network limits.

## Web preview

HTML, CSS, and JavaScript preview source also remains in the browser and is never submitted to the Node.js API.

- The preview iframe uses `sandbox="allow-scripts"` without same-origin, form, navigation, popup, or parent-page privileges.
- A restrictive Content Security Policy blocks network connections, frames, forms, plugins, external assets, and base URL changes.
- HTML is parsed before rendering; scripts, nested frames, plugin elements, external metadata, and inline event attributes are removed.
- Editable JavaScript is parsed with Acorn. Time guards are inserted into `for`, `for...in`, `for...of`, `while`, and `do...while` bodies before it enters the iframe.
- Network and dynamic-code globals such as `fetch`, `XMLHttpRequest`, `WebSocket`, `Worker`, `eval`, and `Function` are shadowed inside the preview.
- Console messages are truncated and capped; a heartbeat watchdog replaces an unresponsive iframe.

This preview is intended for self-authored examples, not arbitrary hostile HTML/JavaScript. A sandboxed `srcdoc` iframe can share a renderer thread with its parent, so the parent watchdog cannot by itself preempt every possible event-loop starvation or browser-engine exploit. AST guards cover ordinary loop mistakes but are not a complete CPU or memory boundary. A public untrusted-code service should host previews on a separate origin and process, apply browser/container resource limits, and treat the browser instance as disposable.

## Claude proxy

- A server-owned key is always locked to `ANTHROPIC_BASE_URL`; a browser cannot redirect that credential to another host.
- A custom upstream is accepted only with a browser-owned key and when `ALLOW_CLIENT_AI_BASE_URL=true`.
- Browser-provided addresses require public HTTPS, cannot contain credentials, query parameters, or fragments, and may be restricted with `AI_ALLOWED_BASE_URLS`.
- Local names, private/reserved IP literals, and domains resolving to private/reserved addresses are rejected. The validated public IP is pinned into the actual TLS connection to prevent DNS rebinding, and redirects are rejected.
- JSON bodies are limited to 32 KB and validated with Zod.
- API and AI requests have separate per-IP limits; AI calls use a short upstream timeout.
- Cross-site browser requests are rejected.
- Client keys are accepted only when `ALLOW_CLIENT_AI_KEY=true` and are not logged or persisted by the server.
- Claude output is parsed and validated before being returned to the browser.

For an internet-facing deployment, set `ALLOW_CLIENT_AI_KEY=false` and `ALLOW_CLIENT_AI_BASE_URL=false`, configure `ANTHROPIC_API_KEY` plus `ANTHROPIC_BASE_URL` on the server, put the application behind authentication, and enforce distributed rate/cost limits at the gateway. If users need custom providers, set an exact `AI_ALLOWED_BASE_URLS` allowlist and enforce outbound network policy outside the process as defense in depth. The in-memory limiter is intended for a single process.

## Reporting

Do not include API keys or user answers in a security report. Rotate any key that may have been exposed.
