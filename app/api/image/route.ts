import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  return NextResponse.json({ error: "Image generation will be added in a later phase" }, { status: 501 });
}
