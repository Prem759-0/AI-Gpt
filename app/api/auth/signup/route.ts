import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/models/User";
import { signToken } from "@/lib/auth";

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const { email, password } = (await req.json()) as { email?: string; password?: string };
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    await connectDB();
    const exists = await UserModel.findOne({ email: email.toLowerCase() });
    if (exists) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.create({ email: email.toLowerCase(), password: hashedPassword });

    const token = signToken({ userId: user._id.toString(), email: user.email as string });
    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }
}
