import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { inngest } from '@/inngest/client';
import { prisma } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limiter';
import { TRPCError } from '@trpc/server';

export const appRouter = createTRPCRouter({
  invoke: baseProcedure 
    .input(
      z.object({
        value: z.string(),
      })
    )
    .mutation(async ({input}) => {
      // Rate limiting check
      const clientId = 'default-client'; // In production, use actual client IP or user ID
      if (!checkRateLimit(clientId, 2, 120000)) { // Max 2 requests per 2 minutes
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Rate limit exceeded. Please wait before creating another agent task.'
        });
      }

      // Create a database record first
      const agentResult = await prisma.agentResult.create({
        data: {
          eventId: `temp-${Date.now()}`, // Temporary ID, will be updated by Inngest
          prompt: input.value,
          status: "pending"
        }
      });

      const event = await inngest.send({
        name: "test/hello.world",
        data: {
          value: input.value,
          recordId: agentResult.id // Pass the record ID to Inngest
        }
      })

      // Update with actual event ID
      await prisma.agentResult.update({
        where: { id: agentResult.id },
        data: {
          eventId: event.ids[0]
        }
      });

      return { 
        ok: "success",
        eventId: event.ids[0],
        recordId: agentResult.id
      }
    }),

  getResult: baseProcedure
    .input(
      z.object({
        eventId: z.string(),
      })
    )
    .query(async ({input}) => {
      // Check if result exists in database
      const result = await prisma.agentResult.findUnique({
        where: { eventId: input.eventId }
      });
      
      return result;
    }),

  getAllResults: baseProcedure
    .query(async () => {
      const results = await prisma.agentResult.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
      });
      
      return results;
    }),

  hello: baseProcedure
    .input(
      z.object({
        text: z.string(),
      }),
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
});
// export type definition of API
export type AppRouter = typeof appRouter;