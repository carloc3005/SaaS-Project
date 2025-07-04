import { Agent, openai, createAgent, createTool } from "@inngest/agent-kit";
import { Sandbox } from "e2b";
import { inngest } from "./client";
import { getSandbox } from "./utils";
import { z } from "zod";



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

             if (typeof newFiles === "object") {
              network.state.data.files = newFiles;
             }

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
                const content = [];
                for (const file of files) {
                  const content = await sandbox.files.read(file);
                  content.push({ path: file, content });
                }
              } catch (e) {
                
              }
            })
          },
        })
      ]
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
