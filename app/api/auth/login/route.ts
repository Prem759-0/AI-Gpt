import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { comparePassword, signToken } from "@/lib/auth";

interface LoginBody {
  email?: string;
  password?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as LoginBody;
    const email = body.email?.toLowerCase().trim();
    const password = body.password?.trim();

    if (!email || !password) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = await comparePassword(password, user.password as string);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken(String(user._id), user.email as string);

    return NextResponse.json({
      token,
      user: { id: String(user._id), email: user.email }
    });
  } catch {
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
}
