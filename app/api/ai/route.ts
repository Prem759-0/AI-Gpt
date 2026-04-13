import { NextResponse } from "next/server";
import { models, type ModelType } from "@/lib/models";
import type { ChatMessage } from "@/types/chat";

interface AiRequestBody {
  message: string;
  type?: ModelType;
}

interface OpenRouterMessage {
  role: ChatMessage["role"];
  content: string;
}

interface OpenRouterChoice {
  message?: {
    content?: string;
  };
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
}

export async function POST(request: Request) {
  const body = (await request.json()) as AiRequestBody;

  if (!body.message || !body.message.trim()) {
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

  const payload = {
    model,
    messages: [{ role: "user", content: body.message }] as OpenRouterMessage[]
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: `OpenRouter failed with status ${response.status}` },
      { status: 502 }
    );
  }

  const data = (await response.json()) as OpenRouterResponse;
  const content = data.choices?.[0]?.message?.content?.trim();

  if (!content) {
    return NextResponse.json({ error: "No response content from AI" }, { status: 502 });
  }

  return NextResponse.json({ content });
}
