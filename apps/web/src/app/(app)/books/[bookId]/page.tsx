"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

interface Book {
  id: string;
  title: string;
  author: string | null;
  language: string;
  toc_text: string | null;
  created_at: string;
}

export default function BookOverviewPage() {
  const params = useParams();
  const bookId = Array.isArray(params.bookId)
    ? params.bookId[0]
    : (params.bookId as string | undefined);
  const [book, setBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [metaForm, setMetaForm] = useState({
    title: "",
    author: "",
    language: "ko",
  });
  const [tocText, setTocText] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingToc, setSavingToc] = useState(false);

  const tocStats = useMemo(() => {
    const lines = tocText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    return { lines: lines.length, chars: tocText.length };
  }, [tocText]);

  const fetchBook = async () => {
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
      if (payload.item) {
        setMetaForm({
          title: payload.item.title ?? "",
          author: payload.item.author ?? "",
          language: payload.item.language ?? "ko",
        });
        setTocText(payload.item.toc_text ?? "");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    }
  };

  useEffect(() => {
    void fetchBook();
  }, [bookId]);

  const updateBook = async (payload: Record<string, string>) => {
    if (!bookId) {
      return false;
    }
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setError("로그인이 필요합니다.");
      return false;
    }
    const res = await fetch(`/api/books/${bookId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const payload = await res.json();
      throw new Error(payload.error ?? "업데이트 실패");
    }
    await fetchBook();
    return true;
  };

  const handleMetaSave = async () => {
    setSavingMeta(true);
    setNotice(null);
    setError(null);
    try {
      await updateBook({
        title: metaForm.title,
        author: metaForm.author,
        language: metaForm.language,
      });
      setNotice("메타데이터가 저장되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleTocSave = async () => {
    setSavingToc(true);
    setNotice(null);
    setError(null);
    try {
      await updateBook({ toc_text: tocText });
      setNotice("TOC가 저장되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setSavingToc(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">워크스페이스</h2>
        <p className="mt-2 text-sm text-zinc-400">
          책별 메타데이터와 TOC를 먼저 설정하세요.
        </p>
      </div>
      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      ) : null}
      {notice ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
          {notice}
        </div>
      ) : null}

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
        <h3 className="text-sm font-semibold text-zinc-200">메타데이터</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            value={metaForm.title}
            onChange={(event) =>
              setMetaForm((prev) => ({ ...prev, title: event.target.value }))
            }
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-white"
            placeholder="책 제목"
          />
          <input
            value={metaForm.author}
            onChange={(event) =>
              setMetaForm((prev) => ({ ...prev, author: event.target.value }))
            }
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-white"
            placeholder="저자"
          />
          <input
            value={metaForm.language}
            onChange={(event) =>
              setMetaForm((prev) => ({ ...prev, language: event.target.value }))
            }
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-white"
            placeholder="언어 (예: ko)"
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleMetaSave}
            disabled={savingMeta}
            className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-900 disabled:opacity-60"
          >
            {savingMeta ? "저장 중..." : "메타데이터 저장"}
          </button>
          <p className="text-xs text-zinc-500">
            생성일: {book?.created_at ? new Date(book.created_at).toLocaleString("ko-KR") : "-"}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">TOC (목차)</h3>
          <p className="text-xs text-zinc-500">
            {tocStats.lines} lines · {tocStats.chars} chars
          </p>
        </div>
        <textarea
          value={tocText}
          onChange={(event) => setTocText(event.target.value)}
          rows={8}
          className="mt-3 w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-white"
          placeholder="목차를 붙여넣으세요. (예: 1장 ... 2장 ...)"
        />
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleTocSave}
            disabled={savingToc}
            className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-900 disabled:opacity-60"
          >
            {savingToc ? "저장 중..." : "TOC 저장"}
          </button>
          <button
            onClick={() => setTocText("")}
            className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-200"
          >
            비우기
          </button>
        </div>
      </section>

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
