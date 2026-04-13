import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Chat from "@/models/Chat";
import { readBearerToken, verifyToken } from "@/lib/auth";

interface UpdateChatBody {
  title?: string;
  messages?: { role: "user" | "assistant"; content: string }[];
}

interface RouteParams {
  params: { id: string };
}

export async function PATCH(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const token = readBearerToken(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = verifyToken(token);
    const body = (await request.json()) as UpdateChatBody;

    await connectDB();

    const updated = await Chat.findOneAndUpdate(
      { _id: params.id, userId },
      {
        ...(body.title ? { title: body.title } : {}),
        ...(body.messages ? { messages: body.messages } : {})
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ chat: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update chat" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams): Promise<Response> {
  try {
    const token = readBearerToken(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = verifyToken(token);

    await connectDB();
    const deleted = await Chat.findOneAndDelete({ _id: params.id, userId });

    if (!deleted) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete chat" }, { status: 500 });
  }
}
