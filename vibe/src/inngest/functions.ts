import { openai, createAgent, createTool, createNetwork } from "@inngest/agent-kit";
import { Sandbox } from "e2b";
import { inngest } from "./client";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";
import { z } from "zod";
import { PROMPT } from "@/prompt";
import { prisma } from "@/lib/db";



export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    // Lifecycle: Function start
    console.log(`Starting helloWorld function with event: ${event.name}`);
    console.log(`Event data:`, event.data);

    // Store initial record in database or get existing one
    const agentResult = await step.run("get-or-create-agent-record", async () => {
      if (event.data.recordId) {
        // Use existing record
        const existing = await prisma.agentResult.findUnique({
          where: { id: event.data.recordId }
        });
        if (existing) return existing;
      }
      
      // Create new record (fallback)
      return await prisma.agentResult.create({
        data: {
          eventId: event.id || `event-${Date.now()}`,
          prompt: event.data.value,
          status: "pending"
        }
      });
    });

    if (!agentResult) {
      throw new Error("Failed to create or find agent result record");
    }

    const sandboxId = await step.run("get-sandboxid", async () => {
      const sandbox = await Sandbox.create("q08bq4s7db512qyjgc3h", { apiKey: process.env.E2B_API_KEY });
      return sandbox.sandboxId;
    })


    const codeAgent = createAgent({
      name: "code-agent",
      description: "An expert coding agent",
      system: PROMPT,
      model: openai({ 
        model: "gpt-4o-mini", // Switch to mini version for higher rate limits
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
          description: "Create or update files in the sandbox. ALWAYS update app/page.tsx first for the main application.",
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
                
                // Prioritize app/page.tsx to be updated first
                const sortedFiles = files.sort((a, b) => {
                  if (a.path === "app/page.tsx") return -1;
                  if (b.path === "app/page.tsx") return 1;
                  return 0;
                });
                
                for(const file of sortedFiles) {
                  await sandbox.files.write(file.path, file.content);
                  updatedFiles[file.path] = file.content;
                  
                  // Log when we update the main page
                  if (file.path === "app/page.tsx") {
                    console.log("✅ Updated main page app/page.tsx with custom content");
                  }
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
          description: "Read files from the sandbox. ALWAYS read app/page.tsx first to see what needs to be replaced.",
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
                  
                  // Special logging for main page
                  if (file === "app/page.tsx") {
                    const isDefaultPage = content.includes("Get started by editing") || 
                                         content.includes("Learn Next.js") ||
                                         content.includes("href=\"https://nextjs.org\"");
                    console.log(`📋 Reading app/page.tsx - Is default page: ${isDefaultPage}`);
                  }
                }
                return JSON.stringify(contents);
              } catch (e) {
                return "Error: " + e;
              }
            })
          },
        }),

        createTool({
          name: "verifyPageReplacement",
          description: "Verify that app/page.tsx has been properly replaced with custom content",
          parameters: z.object({}),
          handler: async ({}, { step }) => {
            return await step?.run("verifyPageReplacement", async () => {
              try {
                const sandbox = await getSandbox(sandboxId);
                const pageContent = await sandbox.files.read("app/page.tsx");
                
                const isDefaultPage = pageContent.includes("Get started by editing") || 
                                     pageContent.includes("Learn Next.js") ||
                                     pageContent.includes("href=\"https://nextjs.org\"") ||
                                     pageContent.includes("docs.vercel.com");
                
                if (isDefaultPage) {
                  return "❌ CRITICAL ERROR: app/page.tsx still contains default Next.js content! The user will see the default landing page. You MUST replace it with your application code.";
                } else {
                  return "✅ SUCCESS: app/page.tsx has been properly replaced with custom application content.";
                }
              } catch (e) {
                return "❌ ERROR: Could not verify app/page.tsx - " + e;
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
      maxIter: 6, // Reduce iterations to use fewer tokens
      router: async ({network}) => {
        const summary = network.state.data.summary;

        if (summary) {
          return;
        }

        return codeAgent;
      }
    })

    // Helper function for retry with exponential backoff
    const retryWithBackoff = async (fn: () => Promise<any>, maxRetries = 3) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error: any) {
          const isRateLimitError = error.message?.includes('Rate limit reached') || 
                                  error.message?.includes('rate_limit_exceeded') ||
                                  error.status === 429;
          
          if (isRateLimitError && attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000; // Add jitter
            console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
            
            // Update status to show retrying
            await prisma.agentResult.update({
              where: { id: agentResult.id },
              data: {
                summary: `Rate limit reached, retrying... (attempt ${attempt}/${maxRetries})`
              }
            });
            
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          throw error;
        }
      }
    };

    try {
      const result = await retryWithBackoff(async () => {
        return await network.run(event.data.value);
      });
      
      const sandboxUrl = await step.run("get-sandbox-url", async () => {
        const sandbox = await getSandbox(sandboxId);
        const host = sandbox.getHost(3000);
        return `https://${host}`;
      })

      // Verify that the main page was actually created
      const pageVerification = await step.run("verify-main-page", async () => {
        try {
          const sandbox = await getSandbox(sandboxId);
          const pageContent = await sandbox.files.read("app/page.tsx");
          
          // Check if it's still the default Next.js page
          const isDefaultPage = pageContent.includes("Get started by editing") || 
                               pageContent.includes("app/page.tsx") ||
                               pageContent.includes("Learn Next.js") ||
                               pageContent.includes("href=\"https://nextjs.org\"") ||
                               pageContent.includes("docs.vercel.com") ||
                               pageContent.includes("nextjs.org/learn");
          
          console.log("📄 Page verification:");
          console.log(`📋 Page content preview: ${pageContent.substring(0, 200)}...`);
          console.log(`🔍 Is default page: ${isDefaultPage}`);
          
          if (isDefaultPage) {
            console.warn("⚠️ WARNING: Main page appears to still be the default Next.js page");
            return {
              verified: false,
              reason: "Main page was not properly updated - still contains default Next.js content",
              preview: pageContent.substring(0, 300)
            };
          }
          
          return {
            verified: true,
            reason: "Main page successfully updated with custom content",
            preview: pageContent.substring(0, 300)
          };
        } catch (error) {
          console.error("Could not verify main page:", error);
          return {
            verified: false,
            reason: "Could not read main page file - " + error,
            preview: "Error reading file"
          };
        }
      });
  
      // Update the database record with the results
      await step.run("update-agent-record", async () => {
        const title = pageVerification.verified ? "Custom Application" : "⚠️ Default Page (Not Updated)";
        const summary = pageVerification.verified 
          ? (result.state.data.summary || "Task completed successfully")
          : `Task completed but ${pageVerification.reason}. Preview: ${pageVerification.preview}`;
          
        console.log("💾 Updating database with:", { title, verified: pageVerification.verified });
        
        return await prisma.agentResult.update({
          where: { id: agentResult.id },
          data: {
            url: sandboxUrl,
            title: title,
            files: result.state.data.files || {},
            summary: summary,
            status: "completed"
          }
        });
      });
  
      return { 
        id: agentResult.id,
        url: sandboxUrl,
        title: "Fragment",
        files: result.state.data.files,
        summary: result.state.data.summary 
      };
    } catch (e) {
      // Update status to failed
      await step.run("mark-as-failed", async () => {
        return await prisma.agentResult.update({
          where: { id: agentResult.id },
          data: {
            status: "failed",
            summary: e instanceof Error ? e.message : "Unknown error occurred"
          }
        });
      });
      
      if (e instanceof Error && e.message.includes("is not valid JSON")) {
        console.error("Failed to parse JSON response from network.run. The response was likely HTML.", e)
        // e.cause is the Response object from node-fetch
        const response = (e as any).cause as Response;
        if (response && response.text) {
          const body = await response.text();
          console.error("Response body:", body);
        }
      }
      throw e;
    }
  },
);
