"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

interface Book {
  id: string;
  title: string;
  author: string | null;
  language: string;
  created_at: string;
}

export default function BookOverviewPage() {
  const params = useParams();
  const bookId = Array.isArray(params.bookId)
    ? params.bookId[0]
    : (params.bookId as string | undefined);
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!bookId) {
        return;
      }
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          setError("로그인이 필요합니다.");
          return;
        }
        const res = await fetch(`/api/books/${bookId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const payload = await res.json();
          throw new Error(payload.error ?? "워크스페이스 정보를 불러오지 못했습니다.");
        }
        const payload = await res.json();
        setBook(payload.item ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      }
    };

    void load();
  }, [bookId]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">워크스페이스</h2>
        <p className="mt-2 text-sm text-zinc-400">
          책별 화면으로 이동해 내용을 구성합니다.
        </p>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
        <p className="text-sm text-zinc-300">{book?.title ?? "로딩 중"}</p>
        <p className="mt-2 text-xs text-zinc-500">
          {book?.author ?? "저자 정보 없음"} · {book?.language ?? "ko"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link
          href={`/books/${bookId}/reader`}
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:border-zinc-500"
        >
          리더 + Q&A
        </Link>
        <Link
          href={`/books/${bookId}/memory`}
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:border-zinc-500"
        >
          메모리
        </Link>
        <Link
          href={`/books/${bookId}/artifacts`}
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:border-zinc-500"
        >
          아티팩트
        </Link>
        <Link
          href={`/books/${bookId}/graph`}
          className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-100 hover:border-zinc-500"
        >
          그래프
        </Link>
      </div>
    </div>
  );
}
