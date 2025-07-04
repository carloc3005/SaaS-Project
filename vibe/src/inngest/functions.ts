import { Agent, openai, createAgent } from "@inngest/agent-kit";
import { Sandbox } from "e2b";
import { inngest } from "./client";
import { getSandbox } from "./utils";


export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const sandboxId = await step.run("get-sandboxid", async () => {
      const sandbox = await Sandbox.create("q08bq4s7db512qyjgc3h");
      return sandbox.sandboxId;
    })


    const codeAgent = createAgent({
      name: "summarizer",
      system: "You are an expert next.js developer.  You write readable, maintainable code. You write simple Next.js & React snippets.",
      model: openai({ model: "gpt-4o" }),
    });

    const output = await step.run("summarize-text", async () => {
      const { output } = await codeAgent.run(
        `Write the following snippets: ${event.data.value}`,
      );
      return output;
    });

    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    })

    return { output, sandboxUrl };
  },
);
