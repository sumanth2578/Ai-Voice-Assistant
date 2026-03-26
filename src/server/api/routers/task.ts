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
              content: `You are an intelligent voice assistant for a task management system.
              
              Rules:
              1. Determine the user's intent: "CREATE", "UPDATE", or "QUERY".
              2. Return ONLY a JSON object with the following keys:
                 - "intent": ("CREATE", "UPDATE", or "QUERY")
                 - "task": (Target task title or new task title)
                 - "user": (Target user name if mentioned)
                 - "status": ("todo", "in-progress", "done" if an update)
                 - "priority": ("low", "medium", "high")
                 - "dueDate": (ISO date string or null)
                 - "tags": (Comma-separated relevant categories e.g. "design, urgency")
                 - "importance": (Score 1-10)
                 - "summary": (Friendly one-sentence summary of the action)
                 - "suggestions": (Comma-separated next steps)
                 - "query_answer": (Natural language answer ONLY if intent is "QUERY")
              
              Context:
              ${usersContext}${tasksContext}
              
              Example Intents:
              - CREATE: "Assign a logo task to Alice" -> {"intent": "CREATE", "task": "Logo", "user": "Alice", ...}
              - UPDATE: "Set the logo task to done" -> {"intent": "UPDATE", "task": "Logo", "status": "done", ...}
              - QUERY: "What is Alice working on?" -> {"intent": "QUERY", "query_answer": "Alice is currently assigned to the 'Logo' task.", ...}`
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
        const parsed = JSON.parse(content || "{}");

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
        tags: z.string().optional(),
        audioData: z.string().optional(),
        importance: z.number().optional(),
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
        if (input.tags) data.tags = input.tags;
        if (input.audioData) data.audioData = input.audioData;
        if (input.importance !== undefined) data.importance = input.importance;

        const task = await ctx.db.task.create({ data: data as any });
        console.log("Task created:", task.id);
        return task;
      } catch (error) {
        console.error("Task create error:", error);
        throw error;
      }
    }),

  update: publicProcedure
    .input(
      z.object({
        taskId: z.string().min(1),
        status: z.string().optional(),
        priority: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.task.update({
        where: { id: input.taskId },
        data: {
          status: input.status,
          priority: input.priority,
        },
        include: { assignedTo: true },
      });
    }),

  getDailyBrief: publicProcedure.query(async ({ ctx }) => {
    const tasks = await ctx.db.task.findMany({
      where: { status: { not: "done" } },
      include: { assignedTo: true },
    });

    if (tasks.length === 0) return "You have no pending tasks. Enjoy your day!";

    const taskList = tasks.map(t => `- ${t.title} (Assigned to ${t.assignedTo.name}, Priority: ${t.priority})`).join("\n");

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional executive assistant. Summarize the following tasks into a natural, encouraging 2-3 sentence morning briefing speaker script."
        },
        {
          role: "user",
          content: `My tasks for today:\n${taskList}`,
        },
      ],
      model: "llama-3.3-70b-versatile",
    });

    return completion.choices[0]?.message?.content || "Ready for your workday!";
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
