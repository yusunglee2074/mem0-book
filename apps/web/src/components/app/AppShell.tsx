"use client";

import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const sections = [
  { id: "reader", label: "리더 + Q&A" },
  { id: "memory", label: "메모리 인스펙터" },
  { id: "artifacts", label: "아티팩트" },
  { id: "graph", label: "컨셉트 그래프" },
];

interface AppShellProps {
  session: Session;
}

export default function AppShell({ session }: AppShellProps) {
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

      <main className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid gap-6 md:grid-cols-2">
          {sections.map((section) => (
            <div
              key={section.id}
              className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6"
            >
              <h2 className="text-lg font-semibold text-zinc-100">
                {section.label}
              </h2>
              <p className="mt-3 text-sm text-zinc-400">
                이 화면은 다음 단계에서 구현됩니다. 현재는 인증과 기본
                레이아웃만 구성되어 있습니다.
              </p>
              <button className="mt-6 rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900">
                열기
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
