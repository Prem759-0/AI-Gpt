import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8">
        <h1 className="text-3xl font-bold">AI SaaS Pro</h1>
        <p className="mt-2 text-zinc-400">Phase 1 + streaming backend connected.</p>
        <div className="mt-6 flex gap-3">
          <Link href="/login" className="rounded-lg bg-zinc-100 px-4 py-2 text-zinc-900 font-medium">
            Login
          </Link>
          <Link href="/signup" className="rounded-lg border border-zinc-700 px-4 py-2">
            Signup
          </Link>
        </div>
      </div>
    </main>
  );
}
