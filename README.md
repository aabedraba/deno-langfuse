# Deno Chat Server

A simple chat expert on Langfuse's docs built with Deno.

## Features

- **AI SDK**: Uses [AI SDK](https://ai-sdk.dev) to build AI-powered products
- **AI Elements ready**: Uses [AI Elements](https://ai-sdk.dev/elements/overviewv) to build AI chatbots
- **Deno native**: Uses Deno's native OpenTelemetry support for tracing
- **Langfuse Integration**: Uses [Prompt Management](https://langfuse.com/docs/prompt-management) and [Observability](https://langfuse.com/docs/tracing)
- **MCP Tools**: Uses [Langfuse Docs's MCP](https://langfuse.com/docs/docs-mcp) tools

## Prerequisites

- Deno 2.4.5+
- Langfuse stack ([Cloud](https://cloud.langfuse.com/) or [Self-Hosted](https://langfuse.com/docs/deployment/self-host))
- Langfuse API key
- OpenAI API key

## How to run

### 1. Configure environment variables

Create a `.env` file:

```sh
cp .env.example .env
```

Then fill in the values.

### 2. Run the server

```sh
OTEL_DENO=true deno run --env-file -A main.ts
```

The server will start on `http://localhost:8000` (or the port specified in your environment variables).

### Make a POST request to /api/chat

Send chat messages to the AI assistant. The response will be a streaming response with AI-generated content, including reasoning and sources when available.

Here's a sample request with [HTTPie](https://httpie.io/):

```sh 
http POST :8000/api/chat \
  chatId=chat_123 \
  userId=u-123 \
  id=V3llV1Sukyxmsrx2 \
  messages:='[{"parts":[{"type":"text","text":"hi! what di you do?"}],"id":"U6JkjwnYnfyN80ca","role":"user"}]' \
  trigger=submit-message
```

## Deploying to production?

Follow the instructions for [deploying Deno applications](https://deno.com/deploy) or use your preferred hosting platform.
