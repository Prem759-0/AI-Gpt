import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { ChatModel } from "@/models/Chat";

function authUser(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return verifyToken(auth.slice(7)).userId;
  } catch {
    return null;
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  const userId = authUser(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const chats = await ChatModel.find({ userId }).sort({ updatedAt: -1 }).lean();
  return NextResponse.json({ chats });
}

export async function POST(req: Request): Promise<NextResponse> {
  const userId = authUser(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title } = (await req.json()) as { title?: string };
  await connectDB();
  const chat = await ChatModel.create({ userId, title: title?.trim() || "New Chat", messages: [] });
  return NextResponse.json({ chat });
}
