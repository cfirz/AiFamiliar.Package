// AWS Lambda streaming proxy for AI Familiar (Unity Editor plugin).
// Forwards requests to OpenAI (Responses API) or Anthropic (Messages API) and pipes the
// upstream response back to the client without buffering, using awslambda.streamifyResponse.
//
// Pairs with API Gateway REST integrations configured with `responseTransferMode: STREAM`
// (15min timeout, launched 2025-11-19) and Lambda Function URLs with `RESPONSE_STREAM`
// invoke mode. Replaces the prior Python handler that called response.read() and buffered
// everything, defeating end-to-end streaming.

const TOOL_ITEM_TYPES = new Set(['function_call', 'function_call_output']);

// 14 minutes — leaves 60s headroom under the 15min API Gateway max.
const UPSTREAM_TIMEOUT_MS = 14 * 60 * 1000;

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*'
};

// ---------- Event normalization ----------

function normalizeEvent(event) {
    // Lambda Function URL events nest method/path under requestContext.http.
    // API Gateway REST events have httpMethod / path at top level.
    const httpCtx = event?.requestContext?.http;
    if (httpCtx) {
        return {
            httpMethod: httpCtx.method ?? 'POST',
            path: httpCtx.path ?? '/',
            headers: event.headers ?? {},
            body: event.body ?? '{}',
            isBase64Encoded: event.isBase64Encoded ?? false
        };
    }
    return event;
}

function getHeader(headers, ...names) {
    if (!headers) return '';
    const lower = {};
    for (const [k, v] of Object.entries(headers)) {
        lower[k.toLowerCase()] = v;
    }
    for (const n of names) {
        const v = lower[n.toLowerCase()];
        if (typeof v === 'string' && v.length > 0) return v;
    }
    return '';
}

function extractApiKey(headers) {
    const auth = getHeader(headers, 'Authorization', 'authorization');
    if (auth) {
        if (auth.startsWith('Bearer ')) return auth.slice(7).trim();
        return auth.trim();
    }
    const apiKey = getHeader(headers, 'X-API-Key', 'x-api-key', 'X-Api-Key');
    return apiKey ? apiKey.trim() : '';
}

// ---------- Provider request shaping (port of lambda_function.py:16–489) ----------

function extractSystemAndNonSystem(requestData) {
    const parts = [];
    const sys = requestData?.system;
    if (typeof sys === 'string' && sys.trim()) parts.push(sys.trim());

    const nonSystem = [];
    for (const msg of requestData?.messages ?? []) {
        const role = (msg?.role ?? '').toString().trim().toLowerCase();
        const content = msg?.content ?? '';
        if (role === 'system') {
            if (typeof content === 'string' && content.trim()) parts.push(content.trim());
            continue;
        }
        nonSystem.push(msg);
    }
    return { instructions: parts.length ? parts.join('\n\n') : null, nonSystem };
}

// OpenAI Responses API content-part types are role-scoped:
//   role=assistant → 'output_text' or 'refusal'
//   role=user/tool/developer → 'input_text', 'input_image', etc.
// Sending 'input_text' on an assistant message returns
// "Invalid value: 'input_text'. Supported values are: 'output_text' and 'refusal'."
function defaultTextType(role) {
    return role === 'assistant' ? 'output_text' : 'input_text';
}

function openaiMessagesToResponsesInput(messages) {
    const items = [];
    for (const msg of messages ?? []) {
        const role = ((msg?.role ?? '').toString().trim().toLowerCase()) || 'user';
        const content = msg?.content ?? '';
        const textType = defaultTextType(role);

        // Multimodal / tool-use replay items
        if (Array.isArray(content)) {
            const toolItems = content.filter(p =>
                p && typeof p === 'object' && TOOL_ITEM_TYPES.has((p.type ?? '').toLowerCase())
            );
            if (toolItems.length > 0) {
                for (const part of toolItems) {
                    const t = (part.type ?? '').toLowerCase();
                    if (t === 'function_call') {
                        items.push({
                            type: 'function_call',
                            call_id: part.call_id ?? part.id,
                            name: part.name,
                            arguments: part.arguments ?? ''
                        });
                    } else if (t === 'function_call_output') {
                        items.push({
                            type: 'function_call_output',
                            call_id: part.call_id ?? part.id,
                            output: part.output ?? ''
                        });
                    }
                }
                const textParts = content
                    .filter(p => p && typeof p === 'object' && (p.type ?? '').toLowerCase() === 'output_text')
                    .map(p => ({ type: 'output_text', text: p.text ?? '' }));
                if (textParts.length > 0) items.push({ role: 'assistant', content: textParts });
                continue;
            }

            const converted = content.map(part => {
                if (!part || typeof part !== 'object') return part;
                if (part.type === 'text') return { type: textType, text: part.text ?? '' };
                if (part.type === 'input_image') return part;
                if (part.type === 'image_url') {
                    const img = part.image_url ?? {};
                    return {
                        type: 'input_image',
                        image_url: img.url ?? '',
                        detail: img.detail ?? 'low'
                    };
                }
                return part;
            });
            items.push({ role, content: converted });
            continue;
        }

        const text = content == null ? '' : (typeof content === 'string' ? content : String(content));
        items.push({ role, content: [{ type: textType, text }] });
    }
    return items;
}

function buildClaudeRequest(requestData, modelName, isStreaming) {
    const req = {
        model: modelName,
        messages: requestData.messages ?? [],
        max_tokens: requestData.max_tokens ?? requestData.max_output_tokens ?? 4096
    };
    if (requestData.system) req.system = requestData.system;
    if (requestData.temperature != null) req.temperature = requestData.temperature;
    if (isStreaming) req.stream = true;
    if (Array.isArray(requestData.tools) && requestData.tools.length > 0) req.tools = requestData.tools;
    if (requestData.tool_choice != null) req.tool_choice = requestData.tool_choice;

    // Extended/adaptive thinking. Forward the client's thinking config verbatim (e.g.
    // { type: "adaptive", display: "summarized" }); fall back to translating the legacy flat
    // thinking_budget_tokens field into Anthropic's native shape. Without this the whitelist
    // above silently dropped both, so thinking never engaged on the proxy path.
    if (requestData.thinking != null) {
        req.thinking = requestData.thinking;
    } else if (typeof requestData.thinking_budget_tokens === 'number' && requestData.thinking_budget_tokens > 0) {
        req.thinking = { type: 'enabled', budget_tokens: requestData.thinking_budget_tokens };
    }
    return req;
}

function buildOpenAIRequest(requestData, modelName, isStreaming) {
    const { instructions, nonSystem } = extractSystemAndNonSystem(requestData);
    const req = {
        model: modelName,
        input: openaiMessagesToResponsesInput(nonSystem),
        stream: isStreaming
    };
    if (instructions) req.instructions = instructions;
    if (requestData.temperature != null) req.temperature = requestData.temperature;
    req.max_output_tokens =
        requestData.max_output_tokens ??
        requestData.max_completion_tokens ??
        requestData.max_tokens ??
        2000;

    // effort and mode share one `reasoning` object — build it when EITHER is present, so pro mode
    // still reaches the API on a request that sets no explicit effort.
    const reasoningEffort = requestData.reasoning_effort;
    const reasoningMode = requestData.reasoning_mode;
    const hasEffort = typeof reasoningEffort === 'string' && reasoningEffort.trim();
    const hasMode = typeof reasoningMode === 'string' && reasoningMode.trim();
    if (hasEffort || hasMode) {
        req.reasoning = {};
        if (hasEffort) req.reasoning.effort = reasoningEffort.trim();
        if (hasMode) req.reasoning.mode = reasoningMode.trim();
    }
    if (Array.isArray(requestData.tools) && requestData.tools.length > 0) req.tools = requestData.tools;
    if (requestData.tool_choice != null) req.tool_choice = requestData.tool_choice;
    return req;
}

// ---------- Response writing helpers ----------

function writeJsonResponse(stream, statusCode, bodyObj) {
    const wrapped = awslambda.HttpResponseStream.from(stream, {
        statusCode,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
    });
    wrapped.write(JSON.stringify(bodyObj));
    wrapped.end();
}

function writeStreamingError(stream, statusCode, bodyObj) {
    // Once SSE has begun, status is locked in; this helper is for pre-flight errors only.
    const wrapped = awslambda.HttpResponseStream.from(stream, {
        statusCode,
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            ...CORS_HEADERS
        }
    });
    wrapped.write(`data: ${JSON.stringify(bodyObj)}\n\n`);
    wrapped.end();
}

// ---------- Main handler ----------

const handlerImpl = async (rawEvent, responseStream, _context) => {
    const event = normalizeEvent(rawEvent);
    let provider = 'OpenAI';

    console.log(`[Lambda] Handler invoked. Method: ${event.httpMethod}, Path: ${event.path}`);
    console.log(`[Lambda] Headers: ${Object.keys(event.headers ?? {}).join(', ')}`);

    try {
        const headers = event.headers ?? {};

        // ---- Auth ----
        const apiKey = extractApiKey(headers);
        if (!apiKey) {
            return writeJsonResponse(responseStream, 401, {
                error: 'Missing API key. Provide either Authorization: Bearer {key} or X-API-Key header',
                debug: { headers_available: Object.keys(headers) }
            });
        }

        // ---- Body parse ----
        let body = event.body ?? '{}';
        if (typeof body === 'string' && event.isBase64Encoded) {
            body = Buffer.from(body, 'base64').toString('utf-8');
        }
        let requestData;
        if (typeof body === 'string') {
            try {
                requestData = JSON.parse(body);
            } catch (e) {
                return writeJsonResponse(responseStream, 400, {
                    error: `Invalid JSON in request body: ${e.message}`,
                    body_preview: body.slice(0, 200)
                });
            }
        } else {
            requestData = body;
        }

        if (!Array.isArray(requestData.messages) || requestData.messages.length === 0) {
            return writeJsonResponse(responseStream, 400, {
                error: 'Missing or empty messages array in request body'
            });
        }

        // ---- Provider selection ----
        const providerHeader = getHeader(headers, 'X-Provider', 'X-Provider-Name');
        const providerFromBody = typeof requestData.provider === 'string' ? requestData.provider.trim() : '';
        const providerRaw = (providerHeader || providerFromBody || 'OpenAI').toLowerCase();
        provider = providerRaw === 'claude' || providerRaw === 'anthropic' ? 'Claude' : 'OpenAI';

        // ---- Key format check ----
        if (provider === 'OpenAI' && !apiKey.startsWith('sk-')) {
            return writeJsonResponse(responseStream, 401, {
                error: 'Invalid API key format. OpenAI keys start with "sk-"'
            });
        }
        if (provider === 'Claude' && !apiKey.startsWith('sk-ant-')) {
            return writeJsonResponse(responseStream, 401, {
                error: 'Invalid API key format. Claude keys start with "sk-ant-"'
            });
        }

        // ---- Build upstream request ----
        const isStreaming = requestData.stream !== false; // default true
        const modelName = requestData.model ?? (provider === 'Claude' ? 'claude-opus-5' : 'gpt-5.6-sol');

        let apiUrl;
        let upstreamHeaders;
        let apiRequest;
        if (provider === 'Claude') {
            apiUrl = 'https://api.anthropic.com/v1/messages';
            apiRequest = buildClaudeRequest(requestData, modelName, isStreaming);
            upstreamHeaders = {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'Content-Type': 'application/json',
                'User-Agent': 'AiFamiliar/1.0 (AWS Lambda)'
            };
            console.log(`[Lambda] Request to Claude - stream: ${isStreaming}, model: ${modelName}, messages: ${apiRequest.messages.length}`);
        } else {
            apiUrl = 'https://api.openai.com/v1/responses';
            apiRequest = buildOpenAIRequest(requestData, modelName, isStreaming);
            upstreamHeaders = {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': 'AiFamiliar/1.0 (AWS Lambda)'
            };
            console.log(`[Lambda] Request to OpenAI - stream: ${isStreaming}, model: ${modelName}, input_items: ${apiRequest.input.length}`);
        }

        const reqBody = JSON.stringify(apiRequest);
        console.log(`[Lambda] Request size: ${Buffer.byteLength(reqBody, 'utf-8')} bytes`);

        // ---- Upstream call with timeout ----
        const abort = new AbortController();
        const timer = setTimeout(() => abort.abort(), UPSTREAM_TIMEOUT_MS);

        let upstream;
        try {
            console.log(`[Lambda] Calling ${provider} API (timeout ${UPSTREAM_TIMEOUT_MS}ms, streaming ${isStreaming})`);
            upstream = await fetch(apiUrl, {
                method: 'POST',
                headers: upstreamHeaders,
                body: reqBody,
                signal: abort.signal
            });
        } catch (e) {
            clearTimeout(timer);
            const isTimeout = e.name === 'AbortError';
            console.log(`[Lambda] Upstream fetch failed: ${e.name}: ${e.message}`);
            return writeJsonResponse(responseStream, 502, {
                error: isTimeout
                    ? `Request to ${provider} API timed out after ${UPSTREAM_TIMEOUT_MS / 1000}s`
                    : `Network error connecting to ${provider} API: ${e.message}`,
                error_type: e.name,
                ...(isTimeout ? { timeout_seconds: UPSTREAM_TIMEOUT_MS / 1000 } : {})
            });
        }

        console.log(`[Lambda] Upstream status: ${upstream.status} ${upstream.statusText}`);

        // ---- Upstream non-2xx: surface as a clean JSON error to the client ----
        if (!upstream.ok) {
            clearTimeout(timer);
            const errBodyText = await upstream.text().catch(() => '');
            const isHtml = /^\s*(<html|<!DOCTYPE)/i.test(errBodyText) || /cloudflare/i.test(errBodyText);

            let errorObj;
            if (isHtml) {
                let msg = `Gateway error (HTTP ${upstream.status})`;
                if (upstream.status === 502) msg = `Bad Gateway: Unable to reach ${provider} API.`;
                else if (upstream.status === 503) msg = `Service Unavailable: ${provider} API is temporarily unavailable.`;
                else if (upstream.status === 504) msg = 'Gateway Timeout: The request took too long to process.';
                errorObj = {
                    error: msg,
                    http_status: upstream.status,
                    http_reason: upstream.statusText,
                    details: 'Received HTML error page instead of JSON.',
                    html_preview: errBodyText.slice(0, 200)
                };
            } else {
                try {
                    errorObj = JSON.parse(errBodyText);
                } catch {
                    errorObj = {
                        error: `HTTP ${upstream.status}: ${upstream.statusText}`,
                        http_status: upstream.status,
                        http_reason: upstream.statusText,
                        response_body: errBodyText.slice(0, 1000)
                    };
                }
            }
            const outStatus = upstream.status >= 500 ? 502 : upstream.status;
            return writeJsonResponse(responseStream, outStatus, errorObj);
        }

        // ---- Success: stream or buffer based on isStreaming ----
        if (isStreaming) {
            const wrapped = awslambda.HttpResponseStream.from(responseStream, {
                statusCode: 200,
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    Connection: 'keep-alive',
                    ...CORS_HEADERS
                }
            });

            try {
                if (!upstream.body) {
                    wrapped.write(`data: ${JSON.stringify({ error: 'Upstream returned no body' })}\n\n`);
                } else {
                    for await (const chunk of upstream.body) {
                        wrapped.write(chunk);
                    }
                }
                wrapped.end();
                console.log('[Lambda] Stream completed successfully');
            } catch (e) {
                // Once we've started writing SSE we can't change the status — append an error event.
                console.log(`[Lambda] Stream error mid-flight: ${e.name}: ${e.message}`);
                try {
                    wrapped.write(`data: ${JSON.stringify({ error: `Stream interrupted: ${e.message}`, error_type: e.name })}\n\n`);
                    wrapped.end();
                } catch { /* connection already closed */ }
            } finally {
                clearTimeout(timer);
            }
            return;
        }

        // Non-streaming (agent mode): buffer once, return as JSON.
        try {
            const text = await upstream.text();
            clearTimeout(timer);
            console.log(`[Lambda] Non-streaming response: ${text.length} bytes`);

            // Validate JSON; fall through to 502 if upstream lied about content-type.
            try {
                JSON.parse(text);
            } catch (je) {
                return writeJsonResponse(responseStream, 502, {
                    error: `${provider} API returned invalid JSON response`,
                    error_details: je.message,
                    response_preview: text.slice(0, 500)
                });
            }

            const wrapped = awslambda.HttpResponseStream.from(responseStream, {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
            });
            wrapped.write(text);
            wrapped.end();
            return;
        } catch (e) {
            clearTimeout(timer);
            return writeJsonResponse(responseStream, 502, {
                error: `Failed to read ${provider} API response: ${e.message}`,
                error_type: e.name
            });
        }
    } catch (e) {
        console.log(`[Lambda] EXCEPTION: ${e.name}: ${e.message}`);
        console.log(e.stack);
        try {
            return writeJsonResponse(responseStream, 500, {
                error: `Proxy error: ${e.message}`,
                error_type: e.name
            });
        } catch {
            // responseStream already closed/written — nothing more we can do.
        }
    }
};

export const handler = awslambda.streamifyResponse(handlerImpl);
