import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Chat from "@/models/Chat";
import { readBearerToken, verifyToken } from "@/lib/auth";

interface CreateChatBody {
  title?: string;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const token = readBearerToken(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    await connectDB();

    const chats = await Chat.find({ userId }).sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ chats });
  } catch {
    return NextResponse.json({ error: "Failed to fetch chats" }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readBearerToken(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = verifyToken(token);
    const body = (await request.json()) as CreateChatBody;

    await connectDB();
    const title = body.title?.trim() || "New Chat";

    const chat = await Chat.create({
      userId,
      title,
      messages: []
    });

    return NextResponse.json({ chat }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
  }
}
