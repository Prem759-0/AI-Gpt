import { NextResponse } from "next/server";
import { readBearerToken, verifyToken } from "@/lib/auth";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error("Missing OPENROUTER_API_KEY environment variable");
}

const models = {
  text: "google/gemma-4-26b-a4b-it:free",
  code: "openai/gpt-oss-120b:free",
  roleplay: "z-ai/glm-4.5-air:free",
  tech: "nvidia/nemotron-3-super-120b-a12b:free",
  translate: "minimax/minimax-m2.5:free"
} as const;

type ModelType = keyof typeof models;
type Message = { role: "user" | "assistant"; content: string };

interface AIRequestBody {
  type?: ModelType;
  messages?: Message[];
}

export async function POST(request: Request): Promise<Response> {
  try {
    const token = readBearerToken(request.headers.get("authorization"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    verifyToken(token);

    const body = (await request.json()) as AIRequestBody;
    const messageList = body.messages ?? [];

    if (!messageList.length) {
      return NextResponse.json({ error: "messages are required" }, { status: 400 });
    }

    const modelType: ModelType = body.type && body.type in models ? body.type : "text";

    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: models[modelType],
        stream: true,
        messages: messageList
      })
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "AI provider request failed" }, { status: 502 });
    }

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";

    const transformed = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = upstream.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;

              const payload = trimmed.replace(/^data:\s*/, "");
              if (payload === "[DONE]") continue;

              try {
                const json = JSON.parse(payload) as {
                  choices?: { delta?: { content?: string } }[];
                };
                const chunk = json.choices?.[0]?.delta?.content;
                if (chunk) {
                  controller.enqueue(encoder.encode(chunk));
                }
              } catch {
                continue;
              }
            }
          }
          controller.close();
        } catch {
          controller.error(new Error("Stream processing failed"));
        }
      }
    });

    return new Response(transformed, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate AI response" }, { status: 500 });
  }
}
