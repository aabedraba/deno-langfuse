import { openai } from "npm:@ai-sdk/openai";
import { generateText, streamText, wrapLanguageModel } from "npm:ai";
import { initLogger, BraintrustMiddleware } from "npm:braintrust";

// Initialize Braintrust logging
initLogger({
  projectName: "my-ai-project",
});

// Wrap your model with Braintrust middleware
const model = wrapLanguageModel({
  model: openai("gpt-4"),
  middleware: BraintrustMiddleware({ debug: true }),
});

async function main() {
  // Generate text with automatic tracing
  const result = await generateText({
    model,
    prompt: "What is the capital of France?",
    system: "Provide a concise answer.",
    maxOutputTokens: 100,
  });

  console.log(result.text);

  // Stream text with automatic tracing
  const stream = streamText({
    model,
    prompt: "Write a haiku about programming.",
  });

  for await (const chunk of stream.textStream) {
    process.stdout.write(chunk);
  }
}

main().catch(console.error);