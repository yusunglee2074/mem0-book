"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

interface Book {
  id: string;
  title: string;
  author: string | null;
  language: string;
  created_at: string;
}

const emptyForm = { title: "", author: "", language: "ko" };

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);

  const loadBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("로그인이 필요합니다.");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/books", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error ?? "워크스페이스 목록을 불러오지 못했습니다.");
      }
      const payload = await res.json();
      setBooks(payload.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBooks();
  }, []);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("로그인이 필요합니다.");
        return;
      }
      const res = await fetch("/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error ?? "워크스페이스 생성 실패");
      }
      setForm(emptyForm);
      await loadBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    }
  };

  const handleUpdate = async (bookId: string) => {
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("로그인이 필요합니다.");
        return;
      }
      const res = await fetch(`/api/books/${bookId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error ?? "워크스페이스 수정 실패");
      }
      setEditingId(null);
      await loadBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    }
  };

  const handleDelete = async (bookId: string) => {
    setError(null);
    if (!confirm("정말 삭제할까요?")) {
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
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error ?? "워크스페이스 삭제 실패");
      }
      await loadBooks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">워크스페이스 관리</h2>
        <p className="mt-2 text-sm text-zinc-400">
          책별 워크스페이스를 만들고 관리합니다.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h3 className="text-sm font-semibold text-zinc-200">워크스페이스 목록</h3>
          {loading ? (
            <p className="mt-4 text-sm text-zinc-500">불러오는 중...</p>
          ) : null}
          {error ? (
            <p className="mt-4 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}
          <div className="mt-4 space-y-3">
            {books.map((book) => (
              <div
                key={book.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4"
              >
                {editingId === book.id ? (
                  <div className="space-y-3">
                    <input
                      value={editForm.title}
                      onChange={(event) =>
                        setEditForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-white"
                      placeholder="책 제목"
                    />
                    <input
                      value={editForm.author}
                      onChange={(event) =>
                        setEditForm((prev) => ({ ...prev, author: event.target.value }))
                      }
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-white"
                      placeholder="저자"
                    />
                    <input
                      value={editForm.language}
                      onChange={(event) =>
                        setEditForm((prev) => ({ ...prev, language: event.target.value }))
                      }
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-white"
                      placeholder="언어"
                    />
                    <div className="flex gap-2">
                      <button
                        className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-900"
                        onClick={() => handleUpdate(book.id)}
                      >
                        저장
                      </button>
                      <button
                        className="rounded-full border border-zinc-700 px-4 py-1.5 text-xs text-zinc-200"
                        onClick={() => setEditingId(null)}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">{book.title}</p>
                        <p className="text-xs text-zinc-500">
                          {book.author ?? "저자 정보 없음"} · {book.language}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/books/${book.id}`}
                          className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200"
                        >
                          열기
                        </Link>
                        <button
                          className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200"
                          onClick={() => {
                            setEditingId(book.id);
                            setEditForm({
                              title: book.title,
                              author: book.author ?? "",
                              language: book.language,
                            });
                          }}
                        >
                          수정
                        </button>
                        <button
                          className="rounded-full border border-red-500/60 px-3 py-1.5 text-xs text-red-200"
                          onClick={() => handleDelete(book.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!loading && books.length === 0 ? (
              <p className="text-sm text-zinc-500">워크스페이스가 없습니다.</p>
            ) : null}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h3 className="text-sm font-semibold text-zinc-200">새 워크스페이스</h3>
          <form onSubmit={handleCreate} className="mt-4 space-y-3">
            <input
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-white"
              placeholder="책 제목"
              required
            />
            <input
              value={form.author}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, author: event.target.value }))
              }
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-white"
              placeholder="저자 (선택)"
            />
            <input
              value={form.language}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, language: event.target.value }))
              }
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-white"
              placeholder="언어 (예: ko)"
            />
            <button className="w-full rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900">
              워크스페이스 만들기
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
