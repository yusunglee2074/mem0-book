"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import AuthPanel from "@/components/auth/AuthPanel";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let supabase: SupabaseClient;

    try {
      supabase = getSupabaseBrowserClient();
    } catch (err) {
      if (isMounted) {
        setError(err instanceof Error ? err.message : "Supabase 설정이 필요합니다.");
        setReady(true);
      }
      return () => {
        isMounted = false;
      };
    }

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!isMounted) {
          return;
        }
        if (sessionError) {
          setError(sessionError.message);
        } else {
          setSession(data.session ?? null);
        }
        setReady(true);
      })
      .catch((err) => {
        if (!isMounted) {
          return;
        }
        setError(err instanceof Error ? err.message : "세션 확인에 실패했습니다.");
        setReady(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }
      setSession(nextSession ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <p className="text-sm text-zinc-400">세션 확인 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-sm text-red-200">
          {error}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100 px-6">
        <AuthPanel />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-zinc-100">
      <div className="max-w-xl space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 text-center">
        <h1 className="text-2xl font-semibold">Mem0 Book 워크스페이스</h1>
        <p className="text-sm text-zinc-400">
          워크스페이스를 만들고 책별 화면으로 이동하세요.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/books"
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:border-zinc-500"
          >
            워크스페이스 관리
          </Link>
          <Link
            href="/core"
            className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:border-zinc-500"
          >
            나의 지식
          </Link>
        </div>
      </div>
    </div>
  );
}
