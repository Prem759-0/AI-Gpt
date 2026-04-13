import { NextResponse } from "next/server";
import { models, type ModelType } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AiRequestBody {
  message: string;
  type?: ModelType;
}

interface OpenRouterChunk {
  choices?: Array<{
    delta?: {
      content?: string;
    };
  }>;
}

function validateBody(body: unknown): body is AiRequestBody {
  return (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string" &&
    body.message.trim().length > 0
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!validateBody(body)) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const modelType: ModelType = body.type ?? "text";
  const model = models[modelType] ?? models.text;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing OPENROUTER_API_KEY in environment" },
      { status: 500 }
    );
  }

  const upstreamResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://vercel.com",
      "X-Title": "AI SaaS Pro"
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages: [{ role: "user", content: body.message.trim() }]
    }),
    cache: "no-store"
  });

  if (!upstreamResponse.ok || !upstreamResponse.body) {
    const fallback = `OpenRouter failed with status ${upstreamResponse.status}`;
    const errorText = await upstreamResponse.text();
    return NextResponse.json({ error: errorText || fallback }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstreamResponse.body!.getReader();
      let buffer = "";

      try {
        while (true) {
          const { value, done } = await reader.read();

          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const data = trimmed.replace(/^data:\s*/, "");
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }

            try {
              const json = JSON.parse(data) as OpenRouterChunk;
              const content = json.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
                );
              }
            } catch {
              // ignore malformed SSE lines from provider
            }
          }
        }
      } finally {
        controller.close();
        reader.releaseLock();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform"
    }
  });
}
