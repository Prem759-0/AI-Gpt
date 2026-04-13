# AI SaaS Pro (Phase 2: Streaming + Animated UI)

This project is a Next.js 14 + TypeScript AI chat app with:
- OpenRouter streaming responses
- model switch options
- animated chat bubbles
- markdown rendering
- icon-based UI

## Setup

```bash
npm install
npm run dev
```

Create `.env.local`:

```env
OPENROUTER_API_KEY=your_openrouter_key
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
```

## Deploy on Vercel
1. Import repo in Vercel.
2. Add env vars (minimum required for chat: `OPENROUTER_API_KEY`).
3. Deploy.

## API

### `POST /api/ai`

Request:

```json
{
  "message": "Explain recursion",
  "type": "tech"
}
```

Response is an SSE stream (`text/event-stream`) with chunks:

```text
data: {"content":"partial text"}

data: [DONE]
```
