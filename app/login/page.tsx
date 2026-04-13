"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data: { token?: string; error?: string } = await res.json();
    if (!res.ok || !data.token) {
      setError(data.error ?? "Login failed");
      return;
    }
    localStorage.setItem("token", data.token);
    router.push("/dashboard");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <form onSubmit={onSubmit} className="w-full space-y-4 rounded-2xl bg-zinc-900 p-6">
        <h1 className="text-2xl font-semibold">Login</h1>
        <input className="w-full rounded-lg bg-zinc-800 p-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded-lg bg-zinc-800 p-3" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button className="w-full rounded-lg bg-indigo-600 p-3">Login</button>
        <p className="text-sm text-zinc-400">No account? <Link href="/signup" className="text-indigo-400">Create one</Link></p>
      </form>
    </main>
  );
}
