import { type Context } from "jsr:@hono/hono@^4.9.6";
import { openai } from "npm:@ai-sdk/openai";
import { LangfuseClient } from "npm:@langfuse/client";
import { StreamableHTTPClientTransport } from "npm:@modelcontextprotocol/sdk/client/streamableHttp.js";
import { trace } from "npm:@opentelemetry/api";
import {
  convertToModelMessages,
  experimental_createMCPClient,
  stepCountIs,
  streamText,
  type UIMessage,
} from "npm:ai";
import { updateActiveObservation, updateActiveTrace, startActiveObservation, observe, getActiveTraceId } from "npm:@langfuse/tracing";


// Using the client to get `prompt` using Languse's 
// Prompt Management: https://langfuse.com/docs/prompt-management 
const langfuseClient = new LangfuseClient({
  baseUrl: Deno.env.get("LANGFUSE_BASE_URL"),
  publicKey: Deno.env.get("LANGFUSE_PUBLIC_KEY"),
  secretKey: Deno.env.get("LANGFUSE_SECRET_KEY"),
});

async function chatHandler(c: Context) {
  try {
    const {
      messages,
      chatId,
      userId,
    }: {
      messages: UIMessage[];
      chatId: string;
      userId: string;
    } = await c.req.json();

    // The prompt text is stored along with a json config that looks like this:
    // ```
    // {
    //   "model": "gpt-5",
    //   "reasoningSummary": "low",
    //   "textVerbosity": "low",
    //   "reasoningEffort": "low"
    // }
    // ```
    const prompt = await langfuseClient.prompt.get("langfuse-expert");
    const promptConfig = prompt.config as {
      model: string;
      reasoningSummary: "low" | "medium" | "high" | "detailed";
      textVerbosity: "low" | "medium" | "high";
      reasoningEffort: "low" | "medium" | "high";
    };

    // We extract the last message from the user and set it 
    // as Langfuse's active observation and trace input so that
    // we can see the user's message easily in the Langfuse UI
    const inputText = messages[messages.length - 1].parts.find(
      (part) => part.type === "text",
    )?.text;

    updateActiveObservation({
      input: inputText,
    });

    updateActiveTrace({
      name: "chat-trace",
      sessionId: chatId,
      userId,
      input: inputText,
    });

    // We create a MCP client to use Langfuse's tools
    // and trace the client initialization calls with `startActiveObservation`
    const langfuseDocsMCPClient = await startActiveObservation(
      "create-mcp-client",
      () => {
        const url = new URL("https://langfuse.com/api/mcp");
        return experimental_createMCPClient({
          transport: new StreamableHTTPClientTransport(url, {
            sessionId: `qa-chatbot-${crypto.randomUUID()}`,
          }),
        });
      },
    );

    const tools = await langfuseDocsMCPClient.tools();

    const result = streamText({
      model: openai(String(promptConfig.model)),
      experimental_telemetry: {
        // This exports AI SDK's traces to the OLTP provider that Deno
        // is using and is built on top of the OpenTelemetry SDK
        isEnabled: true,
      },
      providerOptions: {
        openai: {
          reasoningSummary: promptConfig.reasoningSummary,
          textVerbosity: promptConfig.textVerbosity,
          reasoningEffort: promptConfig.reasoningEffort,
        },
      },
      tools,
      messages: convertToModelMessages(messages),
      system: prompt.prompt,
      stopWhen: stepCountIs(10),
      onFinish: async (result) => {
        // We close the MCP client to release resources
        await langfuseDocsMCPClient.close();

        // Update the output in Langfuse for the UI to display
        updateActiveObservation({
          output: result.content,
        });
        updateActiveTrace({
          output: result.content,
        });

        // End span manually after stream has finished
        trace.getActiveSpan()?.end();
      },
    });

    // Send the traceId back to the frontend so that users can
    // use the feedback widget in the frontend to give feedback on
    // the response and attach that to the trace in Langfuse
    return result.toUIMessageStreamResponse({
      generateMessageId: () => getActiveTraceId() ?? "",
      sendSources: true,
      sendReasoning: true,
    });
  } catch (error) {
    console.error("Error in chat handler:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
}

// Wrap handler with Langfuse's `observe` to trace the handler
export const observedChatHandler = observe(chatHandler, {
  name: "handle-chat-message",
  endOnExit: false, // end observation _after_ stream has finished
});
