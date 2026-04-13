import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { hashPassword, signToken } from "@/lib/auth";

interface SignupBody {
  email?: string;
  password?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as SignupBody;
    const email = body.email?.toLowerCase().trim();
    const password = body.password?.trim();

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    await connectDB();
    const existing = await User.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const created = await User.create({ email, password: hashedPassword });

    const token = signToken(String(created._id), created.email as string);

    return NextResponse.json(
      {
        token,
        user: { id: String(created._id), email: created.email }
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Failed to signup" }, { status: 500 });
  }
}
