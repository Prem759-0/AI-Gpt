import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { ChatModel } from "@/models/Chat";
import type { ChatMessage } from "@/types/chat";

function authUser(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    return verifyToken(auth.slice(7)).userId;
  } catch {
    return null;
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
  const userId = authUser(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { title?: string; messages?: ChatMessage[] };
  await connectDB();

  const updated = await ChatModel.findOneAndUpdate(
    { _id: params.id, userId },
    {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.messages !== undefined ? { messages: body.messages } : {})
    },
    { new: true }
  );

  if (!updated) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  return NextResponse.json({ chat: updated });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
  const userId = authUser(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const deleted = await ChatModel.findOneAndDelete({ _id: params.id, userId });
  if (!deleted) return NextResponse.json({ error: "Chat not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
