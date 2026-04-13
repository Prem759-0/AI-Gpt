# AI SaaS Pro (Phase 1)

A deployable Next.js 14 + TypeScript project with a working non-streaming OpenRouter chat endpoint.

## 1) Install

```bash
npm install
```

## 2) Configure env vars

Create `.env.local` in project root:

```env
OPENROUTER_API_KEY=your_openrouter_key
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
```

> For Phase 1, only `OPENROUTER_API_KEY` is required by the app runtime.

## 3) Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## 4) Deploy to Vercel

1. Import this repository in Vercel.
2. In **Project Settings → Environment Variables**, add:
   - `OPENROUTER_API_KEY`
   - `MONGODB_URI`
   - `JWT_SECRET`
3. Deploy.

## API

### `POST /api/ai`

Body:

```json
{
  "message": "Hello",
  "type": "text"
}
```

`type` supports:
- `text`
- `code`
- `roleplay`
- `tech`
- `translate`

Success response:

```json
{
  "content": "..."
}
```
