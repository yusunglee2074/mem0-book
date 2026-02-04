"use client";

import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import AuthPanel from "@/components/auth/AuthPanel";
import AppLayout from "@/components/app/AppLayout";

export default function BookLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const bookId = Array.isArray(params.bookId)
    ? params.bookId[0]
    : (params.bookId as string | undefined);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState<string | null>(null);

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

  useEffect(() => {
    const loadBook = async () => {
      if (!bookId || !session) {
        return;
      }
      try {
        const res = await fetch(`/api/books/${bookId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) {
          return;
        }
        const payload = await res.json();
        setBookTitle(payload.item?.title ?? null);
      } catch {
        // ignore title load errors for layout
      }
    };

    void loadBook();
  }, [bookId, session]);

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

  if (!bookId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <p className="text-sm text-zinc-400">워크스페이스를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <AppLayout session={session} bookId={bookId} bookTitle={bookTitle}>
      {children}
    </AppLayout>
  );
}
