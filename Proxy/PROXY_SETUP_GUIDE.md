# AI Familiar Proxy — Deployment Guide

## Overview

This is a Node.js 20 AWS Lambda streaming proxy that forwards requests from the Unity
Editor to OpenAI (Responses API) or Anthropic (Messages API). It validates the
caller's API key (`Authorization: Bearer …` or `X-API-Key`) and pipes upstream
chunks back to the client without buffering, enabling true end-to-end SSE streaming.

## Timeouts at a glance

| Endpoint | Max request duration | Idle timeout | Notes |
|---|---|---|---|
| **API Gateway REST + Response Streaming** | **15 minutes** | 5 min (Regional) / 30 s (Edge-optimized) | Launched 2025-11-19. Use `REGIONAL` endpoint type. |
| **Lambda Function URL + `RESPONSE_STREAM`** | **15 minutes** | 5 min | Simplest path. No API Gateway needed. |
| ~~Plain API Gateway buffered integration~~ | ~~29 s~~ | ~~n/a~~ | **Obsolete** — replaced by Response Streaming. |

The SAM template provisions both endpoints from the same Lambda. Use whichever URL
fits your needs and paste it into Unity Editor → AI Familiar Settings → Proxy URL.

## Prerequisites

- AWS Account
- AWS CLI installed and configured
- AWS SAM CLI installed (for the recommended deployment path)
- Node.js 20+ locally (only required if you want `sam local invoke` testing — not
  needed for `sam deploy`)

## Deployment Options

### Option 1 — AWS SAM (Recommended)

This deploys the Node.js Lambda, the Function URL (RESPONSE_STREAM), and a REST API
with Response Streaming enabled — all from one template.

1. Install AWS SAM CLI: <https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html>
2. Open a terminal in this Proxy folder — `Packages/com.cfirz.aifamiliar/Proxy/` for UPM installs, `Assets/AiFamiliar/Proxy/` for `.unitypackage` installs (this guide lives in that same folder) — and run:
   ```bash
   sam build
   sam deploy --guided   # First time only; subsequent deploys can omit --guided
   ```
3. The deploy outputs print two URLs. Pick one for Unity:
   - **`ApiGatewayInvokeUrl`** (e.g. `https://abc123.execute-api.us-east-1.amazonaws.com/prod/suggest`) — recommended if you might add WAF, custom domain, or per-tier throttling later.
   - **`ProxyFunctionUrl`** (e.g. `https://abc123.lambda-url.us-east-1.on.aws/`) — recommended if you want the cheapest, simplest path.
4. Paste the chosen URL into Unity Editor → **Tools → AI Familiar → Settings → Proxy URL**.

### Option 2 — Manual Lambda + REST API in the AWS Console

If you can't use SAM, follow these steps. The **Response Streaming** integration
setting is the critical change — without it, you'll still hit the historical 29-second
ceiling.

#### Step 1 — Create the Lambda function
1. Go to <https://console.aws.amazon.com/lambda/> → **Create function**.
2. Author from scratch:
   - **Function name:** `unity-ai-suggestions-proxy`
   - **Runtime:** `Node.js 20.x`
   - **Architecture:** `x86_64`
3. Click **Create function**.
4. In the **Code** tab, replace the default `index.mjs` with the contents of
   `index.mjs` from the Proxy folder. Click **Deploy**.
5. In **Configuration → General configuration → Edit**:
   - **Timeout:** `15 min 0 sec` (the new ceiling)
   - **Memory:** `256 MB` (sufficient; raise only if you see cold-start pressure)

#### Step 2 — Create the REST API with Response Streaming
1. Go to <https://console.aws.amazon.com/apigateway/> → **Create API → REST API → Build**.
2. **API name:** `unity-ai-suggestions-api`. **Endpoint type:** **Regional**
   (NOT Edge-optimized — the 30-second idle timeout there will cut off slow models).
3. Create resource: **Resource Name** `suggest`, path `/suggest`, enable CORS.
4. Create method **POST** on `/suggest`:
   - Integration type: **Lambda Function**
   - **Use Lambda Proxy integration:** ✓
   - Lambda Function: `unity-ai-suggestions-proxy`
   - **Response transfer mode:** **Stream** *(this is the new option that lifts the 29s ceiling)*
   - Save.
5. Enable CORS on `/suggest` — Allow Origin `*`, Allow Headers `Authorization,Content-Type,X-API-Key,X-Provider`, Allow Methods `POST,OPTIONS`.
6. **Deploy API** → New stage → name `prod`.
7. Copy the **Invoke URL** and append `/suggest` (e.g.,
   `https://abc123.execute-api.us-east-1.amazonaws.com/prod/suggest`). Use this in Unity.

### Option 3 — Lambda Function URL only (no API Gateway)

Cheaper and simpler. Forfeit WAF/custom-domain/throttling for fewer moving parts.

1. Create the Lambda exactly as in Option 2, Step 1.
2. **Configuration → Function URL → Create function URL**:
   - **Auth type:** `NONE` (or `AWS_IAM` if your client signs requests — Unity client doesn't)
   - **Invoke mode:** **`RESPONSE_STREAM`** *(critical — `BUFFERED` reverts to the buffered behavior)*
   - **CORS:** Origin `*`, Allow Headers `Authorization,Content-Type,X-API-Key,X-Provider`, Allow Methods `POST,OPTIONS`
3. Copy the Function URL (e.g., `https://abc123.lambda-url.us-east-1.on.aws/`) and use it as-is in Unity.

## Configuration

The proxy is a pure pass-through — no environment variables required. The Unity
client sends:

- `Authorization: Bearer <api-key>` (or `X-API-Key: <api-key>` as a fallback)
- `X-Provider: OpenAI` or `X-Provider: Claude`
- JSON body with `model`, `messages`, `stream`, `temperature`, `max_output_tokens`, etc.

## Cost

AWS Lambda free tier covers 1M requests/month and 400,000 GB-s/month, easily
absorbing typical solo-developer use. Response Streaming is billed at the same per-
request rate as buffered invocations; data beyond the first 10 MB per response is
throttled (2 MB/s) and rounded up in 10 MB chunks for billing.

## Testing

Smoke-test the deployed proxy with curl. The `-N` flag disables curl's output
buffering so you can see tokens stream in real time:

```bash
curl -N -X POST https://YOUR_INVOKE_URL/suggest \
  -H "Authorization: Bearer sk-YOUR_OPENAI_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Provider: OpenAI" \
  -d '{
    "model": "gpt-5.5",
    "messages": [{"role":"user","content":"Count slowly to ten."}],
    "stream": true,
    "max_output_tokens": 200
  }'
```

You should see `data: {...}\n\n` chunks appearing progressively, not all at once.

For Claude:

```bash
curl -N -X POST https://YOUR_INVOKE_URL/suggest \
  -H "Authorization: Bearer sk-ant-YOUR_KEY" \
  -H "Content-Type: application/json" \
  -H "X-Provider: Claude" \
  -d '{
    "model": "claude-haiku-4-5",
    "messages": [{"role":"user","content":"Count slowly to ten."}],
    "stream": true,
    "max_tokens": 200
  }'
```

## Files

- `index.mjs` — Node.js 20 streaming Lambda handler
- `package.json` — `"type": "module"`, no runtime deps (uses built-in `fetch`)
- `template.yaml` — AWS SAM template (provisions Lambda + Function URL + REST API)

## Security Notes

- The proxy never logs API keys (they are masked in CloudWatch).
- For Function URL deployments, consider switching `AuthType: NONE` → `AWS_IAM` and
  signing requests from the client (the Unity client does not currently sign — this
  would require a small client change).
- For API Gateway deployments, you can add WAF, AWS Cognito User Pools, or a Lambda
  Authorizer in front — Response Streaming is compatible with all three.

## Troubleshooting

See `TROUBLESHOOTING_502.md` for 502/504 diagnostics and `LAMBDA_TESTING_GUIDE.md`
for invoking the Lambda directly from the AWS Console test panel.
