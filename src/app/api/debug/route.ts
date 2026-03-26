import { NextResponse } from "next/server";
import { db } from "~/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const users = await db.user.findMany();
    const tasks = await db.task.findMany();
    return NextResponse.json({
      ok: true,
      userCount: users.length,
      users: users.map((u) => u.name),
      taskCount: tasks.length,
      dbUrl: process.env.DATABASE_URL?.replace(/:[^@]+@/, ":***@"),
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message,
      dbUrl: process.env.DATABASE_URL?.replace(/:[^@]+@/, ":***@"),
    });
  }
}
