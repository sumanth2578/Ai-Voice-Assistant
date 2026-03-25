import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import Groq from "groq-sdk";
import fs from "fs";
import os from "os";
import path from "path";

const groq = new Groq({ apiKey: env.GROQ_API_KEY });

export const taskRouter = createTRPCRouter({
  transcribe: publicProcedure
    .input(z.object({ audioBase64: z.string() }))
    .mutation(async ({ input }) => {
      const tempPath = path.join(os.tmpdir(), `audio-${Date.now()}.webm`);
      try {
        if (!input.audioBase64) {
          throw new Error("Empty audio data received");
        }

        const buffer = Buffer.from(input.audioBase64, "base64");
        fs.writeFileSync(tempPath, buffer);

        const transcription = await groq.audio.transcriptions.create({
          file: fs.createReadStream(tempPath),
          model: "whisper-large-v3-turbo",
          language: "en",
        });

        console.log("Groq Transcription Result:", transcription.text);
        return transcription.text.trim();
      } catch (error) {
        console.error("Transcription Error:", error);
        throw new Error("Voice recognition failed. Groq Whisper engine error.");
      } finally {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath);
        }
      }
    }),

  parseCommand: publicProcedure
    .input(z.object({ 
      transcript: z.string(),
      users: z.array(z.string()).optional(),
      tasks: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const usersContext = input.users?.length 
          ? `\nAvailable Users: ${input.users.join(", ")}` 
          : "";
        const tasksContext = input.tasks?.length 
          ? `\nExisting Tasks: ${input.tasks.join(", ")}` 
          : "";

        const completion = await groq.chat.completions.create({
          messages: [
            {
              role: "system",
              content: `You are an expert at extracting task assignments from conversational transcripts.
              
              Rules:
              1. Return ONLY a JSON object with "task", "user", "priority", "dueDate", "summary", and "suggestions" keys.
              2. The "task" should be a concise title.
              3. The "user" should be the performer name.
              4. "priority" MUST be "low", "medium", or "high". (Default: "medium")
              5. "dueDate" should be an ISO date string if mentioned, otherwise null.
              6. "summary" should be a friendly, one-sentence summary of the task.
              7. "suggestions" should be a string containing 2-3 short, helpful next steps (comma separated).
              ${usersContext}${tasksContext}
              
              Example: "Assign high priority logo task to Alice for next Friday" 
              -> {"task": "Logo", "user": "Alice", "priority": "high", "dueDate": "2026-04-03", "summary": "Alice will design the new brand logo by next Friday.", "suggestions": "Review style guide, Contact Alice for kickoff, Check Pinterest for inspiration"}`
            },
            {
              role: "user",
              content: input.transcript,
            },
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
        });

        const content = completion.choices[0]?.message?.content;
        const parsed = JSON.parse(content || '{"task": "", "user": "", "priority": "medium", "dueDate": null, "summary": "", "suggestions": ""}') as { 
          task: string; 
          user: string; 
          priority: string; 
          dueDate: string | null;
          summary: string;
          suggestions: string;
        };

        return {
          ...parsed,
          originalTranscript: input.transcript,
        };
      } catch (error) {
        console.error("Groq Parsing Error:", error);
        throw new Error("Failed to parse command.");
      }
    }),
  getAll: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.task.findMany({
      include: { assignedTo: true },
      orderBy: { createdAt: "desc" },
    });
  }),

  getUsers: publicProcedure.query(async ({ ctx }) => {
    return await ctx.db.user.findMany();
  }),

  create: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        userId: z.string().min(1),
        priority: z.string().optional(),
        dueDate: z.string().nullish(),
        transcript: z.string().optional(),
        summary: z.string().optional(),
        suggestions: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        console.log("Creating task with:", JSON.stringify(input));
        const data: Record<string, unknown> = {
          title: input.title,
          userId: input.userId,
        };
        if (input.priority) data.priority = input.priority;
        if (input.dueDate) data.dueDate = new Date(input.dueDate);
        if (input.transcript) data.transcript = input.transcript;
        if (input.summary) data.summary = input.summary;
        if (input.suggestions) data.suggestions = input.suggestions;

        const task = await ctx.db.task.create({ data: data as any });
        console.log("Task created:", task.id);
        return task;
      } catch (error) {
        console.error("Task create error:", error);
        throw error;
      }
    }),

  assign: publicProcedure
    .input(
      z.object({
        taskId: z.string().min(1),
        userId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.task.update({
        where: { id: input.taskId },
        data: { userId: input.userId },
      });
    }),
});
