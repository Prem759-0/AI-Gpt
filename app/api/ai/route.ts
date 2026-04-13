import { NextResponse } from "next/server";
import { models, type ModelType } from "@/lib/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AiRequestBody {
  message: string;
  type?: ModelType;
}

interface OpenRouterTextPart {
  type: "text";
  text: string;
}

interface OpenRouterChoice {
  message?: {
    content?: string | OpenRouterTextPart[];
  };
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
}

function getContent(response: OpenRouterResponse): string {
  const rawContent = response.choices?.[0]?.message?.content;

  if (typeof rawContent === "string") {
    return rawContent.trim();
  }

  if (Array.isArray(rawContent)) {
    return rawContent
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("")
      .trim();
  }

  return "";
}

export async function POST(request: Request) {
  let body: AiRequestBody;

  try {
    body = (await request.json()) as AiRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.message?.trim()) {
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

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://vercel.com",
      "X-Title": "AI SaaS Pro"
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: body.message.trim() }],
      stream: false
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    const fallback = `OpenRouter failed with status ${response.status}`;
    const errorText = await response.text();
    return NextResponse.json(
      {
        error: errorText || fallback
      },
      { status: 502 }
    );
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = getContent(data);

  if (!content) {
    return NextResponse.json({ error: "No response content from AI" }, { status: 502 });
  }

  return NextResponse.json({ content });
}
