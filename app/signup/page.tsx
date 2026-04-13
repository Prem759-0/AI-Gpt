"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = (await res.json()) as { token?: string; error?: string };

    if (!res.ok || !data.token) {
      setError(data.error ?? "Signup failed");
      setLoading(false);
      return;
    }

    localStorage.setItem("token", data.token);
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 space-y-4">
        <h1 className="text-2xl font-bold">Signup</h1>
        <input className="w-full rounded-lg bg-zinc-800 px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-lg bg-zinc-800 px-3 py-2" type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button disabled={loading} className="w-full rounded-lg bg-zinc-100 text-zinc-900 py-2 font-semibold">
          {loading ? "Loading..." : "Signup"}
        </button>
        <p className="text-sm text-zinc-400">
          Already have account? <Link href="/login" className="underline">Login</Link>
        </p>
      </form>
    </main>
  );
}
