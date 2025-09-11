import { NodeSDK } from "npm:@opentelemetry/sdk-node";
import { BraintrustSpanProcessor } from "npm:braintrust";

const sdk = new NodeSDK({
  spanProcessors: [
    new BraintrustSpanProcessor({
      parent: `project_name:langfuse-deno-chat`,
      filterAISpans: true,
    }),
  ],
});

sdk.start();