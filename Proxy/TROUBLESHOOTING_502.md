# Troubleshooting 502 / 504 from the Proxy

Most 502/504 errors from this proxy used to come from API Gateway's 29-second
integration timeout. With **Response Streaming** (REST API,
`responseTransferMode: STREAM`) or **Lambda Function URLs** (`InvokeMode:
RESPONSE_STREAM`), the timeout is now 15 minutes. If you're still seeing 502/504,
walk through this guide.

## Quick checklist

- [ ] REST API integration has **Response transfer mode = Stream** (or Function URL has **Invoke mode = RESPONSE_STREAM**).
- [ ] REST API endpoint type is **Regional**, NOT Edge-optimized (Edge has a 30-second idle timeout).
- [ ] Lambda **Timeout** is set to 15 min (`900` seconds) in **Configuration → General configuration**.
- [ ] Lambda **Runtime** is `nodejs20.x` and the deployed code includes `awslambda.streamifyResponse`.
- [ ] CORS allows headers `Authorization`, `Content-Type`, `X-API-Key`, `X-Provider`.

## Step 1 — Read CloudWatch logs

1. Go to <https://console.aws.amazon.com/cloudwatch/> → **Log groups** → `/aws/lambda/<your-function-name>`.
2. Open the most recent log stream and search for entries prefixed `[Lambda]`.
3. Pattern-match the failure:

| Log line | Meaning | Fix |
|---|---|---|
| (no logs at all) | API Gateway / Function URL never invoked the Lambda | Check the integration is wired up; check Lambda Permission resource. |
| `[Lambda] EXCEPTION: ...` | Handler threw before responding | Open the stack trace; usually a malformed request body or missing header. |
| `[Lambda] Upstream fetch failed: AbortError` | Upstream LLM exceeded the 14-min internal timeout | Almost never legit — check the upstream API's own status page. |
| `[Lambda] Upstream status: 5xx` | OpenAI / Anthropic returned an error | Inspect the body the proxy returns (the upstream error is forwarded). |
| `[Lambda] Stream error mid-flight` | Connection dropped while streaming | Check client logs for the corresponding `Connection lost during streaming` message; usually a network blip — retry. |

## Step 2 — Verify the integration is actually streaming

A common foot-gun: the integration was created **before** Response Streaming
launched and the team never enabled it. The symptom is that the Lambda finishes
fine but the client still sees 504 around the 29-second mark.

### REST API
1. API Gateway Console → your API → `/suggest` resource → POST → **Integration request**.
2. Look for **Response transfer mode**. Required value: **Stream**.
3. If you change it, redeploy the stage (Actions → Deploy API → choose `prod`).

### Lambda Function URL
1. Lambda Console → your function → **Configuration → Function URL**.
2. Look for **Invoke mode**. Required value: **`RESPONSE_STREAM`** (NOT `BUFFERED`).
3. Save — no redeploy needed; takes effect immediately.

## Step 3 — Endpoint type matters

| Endpoint type | Idle timeout | Suitable for slow LLMs? |
|---|---|---|
| Regional | 5 minutes | ✅ Yes |
| Private | 5 minutes | ✅ Yes |
| Edge-optimized | 30 seconds | ❌ No — reasoning models can stall longer than this between tokens |
| Lambda Function URL | 5 minutes | ✅ Yes |

If your REST API is Edge-optimized, switch to Regional. (You'll need to recreate the
API since endpoint type can't be edited in place.)

## Step 4 — Test the Lambda in isolation

To rule out gateway misconfiguration, invoke the Lambda directly from the AWS
Console with one of the JSON payloads under `tests/`:

```bash
aws lambda invoke \
  --function-name UnityAISuggestionsProxy \
  --payload file://tests/test_event_chat_mode.json \
  /tmp/response.json \
  --cli-binary-format raw-in-base64-out
cat /tmp/response.json
```

If this returns 200 with a streamed body, the Lambda is healthy and the issue is
in the gateway integration.

## Step 5 — If 502 persists after the above

Share these in your bug report:

1. CloudWatch log stream URL (or the full `[Lambda]`-prefixed lines from the failed
   request).
2. Output of `aws apigateway get-integration --rest-api-id <id> --resource-id <id>
   --http-method POST` (look for `responseTransferMode`).
3. The exact error text Unity surfaces in the AI Familiar window (full
   `OnError(...)` text from the C# console).

## Historical note

The previous version of this guide recommended raising the API Gateway integration
timeout from 29 s to 120 s via a service quota request. That advice is now
**superseded** — Response Streaming achieves the same outcome (and more) without
requiring a quota increase, and AWS Support actively recommends it as the
replacement.
