import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold">AI SaaS Pro</h1>
      <p className="text-zinc-400">JWT auth, MongoDB storage, and OpenRouter streaming chat.</p>
      <div className="flex gap-4">
        <Link href="/login" className="rounded-lg bg-zinc-800 px-4 py-2 hover:bg-zinc-700">Login</Link>
        <Link href="/signup" className="rounded-lg bg-indigo-600 px-4 py-2 hover:bg-indigo-500">Sign up</Link>
      </div>
    </main>
  );
}
