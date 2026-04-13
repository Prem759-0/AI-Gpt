import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request): Promise<NextResponse> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = auth.slice(7);
    const payload = verifyToken(token);
    return NextResponse.json({ user: payload });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
