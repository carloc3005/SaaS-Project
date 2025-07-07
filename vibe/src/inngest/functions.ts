import { openai, createAgent, createTool, createNetwork } from "@inngest/agent-kit";
import { Sandbox } from "e2b";
import { inngest } from "./client";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { z } from "zod";
import { PROMPT } from "@/prompt";



export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    // Lifecycle: Function start
    console.log(`Starting helloWorld function with event: ${event.name}`);
    console.log(`Event data:`, event.data);

    const sandboxId = await step.run("get-sandboxid", async () => {
      const sandbox = await Sandbox.create("q08bq4s7db512qyjgc3h");
      return sandbox.sandboxId;
    })


    const codeAgent = createAgent({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({ model: "gpt-4o",
        defaultParameters: {
          temperature: 0.1,
        }
       }),
      tools: [
        createTool({
          name: "terminal",
          description: "Use the terminal to run commands",
          parameters: z.object({
            command: z.string(),
          }),
          handler: async ({command}, {step}) => {
            return await step?.run("terminal", async () => {
              const buffers = { stdout: "", stderr: "" };

              try {
                const sandbox = await getSandbox(sandboxId);
                const result = await sandbox.commands.run(command, {
                  onStdout: (data: string) => {
                    buffers.stdout += data;
                  },
                  onStderr: (data: string) => {
                    buffers.stderr += data;
                  }
                });

                return {
                  stdout: buffers.stdout,
                  stderr: buffers.stderr,
                  exitCode: result.exitCode
                };
              } catch (e) {
                console.error(
                  `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`,
                )

                return `Command failed: ${e} \nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
              }
            })
          }
        }),

        createTool({
          name: "createOrUpdateFiles",
          description: "Create or update files in the sandbox",
          parameters: z.object({
            files: z.array(
              z.object({
                path: z.string(),
                content: z.string()
              }),
            ),
          }),
          handler: async ({files}, {step}) => {
            return await step?.run("createOrUpdateFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const updatedFiles: Record<string, string> = {};
                
                for(const file of files) {
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path] = file.content;
                }
                
                return {
                  success: true,
                  filesUpdated: Object.keys(updatedFiles),
                  files: updatedFiles
                };
              } catch (e) {
                console.error(`Failed to create/update files: ${e}`);
                return {
                  success: false,
                  error: e instanceof Error ? e.message : "Unknown error occurred"
                };
              }


            });
          }
        }),

        createTool({
          name: "readFiles",
          description: "Read files from the sandbox",
          parameters: z.object({
            files: z.array(z.string()),
          }),
          handler: async ({ files }, { step }) => {
            return await step?.run("readFiles", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const contents = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  contents.push({ path: file, content });
                }
                return JSON.stringify(contents);
              } catch (e) {
                return "Error: " + e;
              }
            })
          },
        }),

        createTool({
          name: "lastAssistantTextMessageContent",
          description: "Get the last assistant text message content from an agent result",
          parameters: z.object({
            result: z.any() // AgentResult type
          }),
          handler: async ({ result }, { step }) => {
            return await step?.run("lastAssistantTextMessageContent", async () => {
              try {
                const lastContent = lastAssistantTextMessageContent(result);
                return lastContent || "No assistant text message found";
              } catch (e) {
                return "Error: " + e;
              }
            })
          },
        })
      ],

      lifecycle: {
        onResponse: async ({ result, network }) => {
          // Extract the output from the agent result
          const output = result.output;

          if (output && network) {
            // Convert output to string if it's not already
            const outputString = typeof output === 'string' ? output : JSON.stringify(output);
            
            if (outputString.includes("<task_summary")) {
              // Handle task summary logic here
            }
          }

          return result;
        }
      }
    });

    const network = createNetwork({
      name: "coding-agent-network",
      agents: [codeAgent],
      maxIter: 15,
      router: async ({network}) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }

        return codeAgent;
      }
    })

    const result = await network.run(event.data.value);


    const sandboxUrl = await step.run("get-sandbox-url", async () => {
      const sandbox = await getSandbox(sandboxId);
      const host = sandbox.getHost(3000);
      return `https://${host}`;
    })



    return { 
      url: sandboxUrl,
      title: "Fragment",
      files: result.state.data.files,
      summary: result.state.data.summary 
    };
  },
);
