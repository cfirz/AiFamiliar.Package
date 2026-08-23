# AWS Lambda Testing Guide

This guide explains how to test the deployed Lambda directly via the AWS Console
test panel, without going through API Gateway. Use this to isolate "is the Lambda
healthy?" from "is my gateway integration correct?".

## Prerequisites

1. The Lambda is deployed (`UnityAISuggestionsProxy` from the SAM template, or
   whatever name you used).
2. You have a valid OpenAI key (`sk-...`) or Anthropic key (`sk-ant-...`).

## Step 1 — Open the function

1. <https://console.aws.amazon.com/lambda/> → click your function.
2. Switch to the **Test** tab.

## Step 2 — Create a test event

Click **Create new test event**, name it (e.g., `chat-mode-streaming`), and paste
one of the payloads below.

Replace the placeholder API key with a real one before saving.

### Chat mode (streaming)

```json
{
  "httpMethod": "POST",
  "path": "/suggest",
  "headers": {
    "Authorization": "Bearer sk-YOUR-OPENAI-KEY",
    "Content-Type": "application/json",
    "X-Provider": "OpenAI"
  },
  "body": "{\"model\":\"gpt-5.5\",\"messages\":[{\"role\":\"user\",\"content\":\"Say hello in one sentence.\"}],\"stream\":true,\"max_output_tokens\":100}",
  "isBase64Encoded": false
}
```

### Agent mode (non-streaming)

```json
{
  "httpMethod": "POST",
  "path": "/suggest",
  "headers": {
    "Authorization": "Bearer sk-YOUR-OPENAI-KEY",
    "Content-Type": "application/json",
    "X-Provider": "OpenAI"
  },
  "body": "{\"model\":\"gpt-5.5\",\"messages\":[{\"role\":\"user\",\"content\":\"Say hello in one sentence.\"}],\"stream\":false,\"max_output_tokens\":100}",
  "isBase64Encoded": false
}
```

### Claude streaming — for testing Anthropic routing

```json
{
  "httpMethod": "POST",
  "path": "/suggest",
  "headers": {
    "Authorization": "Bearer sk-ant-YOUR-ANTHROPIC-KEY",
    "Content-Type": "application/json",
    "X-Provider": "Claude"
  },
  "body": "{\"model\":\"claude-haiku-4-5\",\"messages\":[{\"role\":\"user\",\"content\":\"Say hello in one sentence.\"}],\"stream\":true,\"max_tokens\":100}",
  "isBase64Encoded": false
}
```

## Step 3 — Run the test

Click **Test**. The execution panel shows three things:

- **Execution result:** `succeeded` / `failed`.
- **Function Logs:** the CloudWatch logs for this invocation. Look for `[Lambda]`
  prefixed lines.
- **Response:** the actual response body the Lambda returned. For streaming
  invocations, the Console renders it as a single concatenated payload — that's
  expected; the real streaming behavior only manifests through
  HTTPS clients (curl `-N`, the Unity client, etc.), not the Console test panel.

## What "success" looks like

| Mode | Expected response shape |
|---|---|
| Streaming (`stream: true`) | Body is `text/event-stream` content: many `data: {...}\n\n` blocks ending with `data: [DONE]`. |
| Non-streaming (`stream: false`) | Body is a single JSON object with `choices[0].message.content` (OpenAI Chat Completions format) or `content[0].text` (Anthropic Messages format). The proxy uses the OpenAI **Responses** API for OpenAI requests, so the shape is `output[0].content[0].text` for newer fields. |

## Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| `401 Missing API key` | `Authorization` header empty / wrong key in test event | Paste the real key into the test JSON. |
| `401 Invalid API key format` | OpenAI key doesn't start with `sk-` (or Claude with `sk-ant-`) | Confirm provider header matches the key type. |
| `400 Missing or empty messages array` | Body JSON malformed (most often: forgot to escape inner quotes) | Validate the `body` field is a single escaped JSON string. |
| `502 Bad Gateway: Unable to reach …` | Upstream (OpenAI / Anthropic) returned 5xx | Check the upstream API status page. |
| Response truncated mid-stream | Invocation hit Lambda's per-request `Timeout` setting (default 900 s in the SAM template) | Should not happen unless the upstream itself stalls — check CloudWatch for `AbortError`. |

## Local testing with `sam local invoke`

If you have the SAM CLI and Docker installed, you can invoke the function locally
without deploying. Save one of the payloads from Step 2 above (e.g. the chat-mode
JSON) to a local file, `test_event.json`, then from a terminal in the Proxy folder
(`Packages/com.cfirz.aifamiliar/Proxy/` for UPM installs, `Assets/AiFamiliar/Proxy/`
for `.unitypackage` installs) run:

```bash
sam build
sam local invoke AISuggestionsProxyFunction \
  --event test_event.json
```

Note: `sam local` does not currently emulate Response Streaming — the local invoke
returns a buffered response, so streaming behavior must be verified against the
deployed function.
