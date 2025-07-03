import { Agent, openai, createAgent } from "@inngest/agent-kit";
import { inngest } from "./client";


export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const codeAgent = createAgent({
      name: "summarizer",
      system: "You are an expert next.js developer.  You write readable, maintainable code. You write simple Next.js & React snippets.",
      model: openai({ model: "gpt-4o" }),
    });

    const summary = await step.run("summarize-text", async () => {
      const { output } = await codeAgent.run(
        `Write the following snippets: ${event.data.value}`,
      );
      return output;
    });

    return { summary };
  },
);
