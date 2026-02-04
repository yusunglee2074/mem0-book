"use client";

import Link from "next/link";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const navItems = [
  { href: "/reader", label: "리더 + Q&A" },
  { href: "/memory", label: "메모리" },
  { href: "/artifacts", label: "아티팩트" },
  { href: "/graph", label: "그래프" },
  { href: "/core", label: "나의 지식" },
];

interface AppLayoutProps {
  session: Session;
  children: React.ReactNode;
}

export default function AppLayout({ session, children }: AppLayoutProps) {
  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-zinc-400">Mem0 Book</p>
            <h1 className="text-xl font-semibold">학습 워크스페이스</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{session.user.email}</span>
            <button
              onClick={handleSignOut}
              className="rounded-full border border-zinc-700 px-4 py-1.5 text-sm text-zinc-200 hover:border-zinc-500"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-2 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-2xl px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800/70 hover:text-white"
            >
              {item.label}
              <span className="text-xs text-zinc-500">›</span>
            </Link>
          ))}
        </nav>
        <main className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
