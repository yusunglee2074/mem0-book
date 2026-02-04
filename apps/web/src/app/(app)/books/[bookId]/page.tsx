"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isUuid } from "@/lib/validators/uuid";

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
  const [tocResult, setTocResult] = useState<string | null>(null);
  const [metaForm, setMetaForm] = useState({
    title: "",
    author: "",
    language: "ko",
  });
  const [tocText, setTocText] = useState("");
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingToc, setSavingToc] = useState(false);
  const [parsingToc, setParsingToc] = useState(false);
  const [sections, setSections] = useState<
    { id: string; title: string; depth: number }[]
  >([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [epubFile, setEpubFile] = useState<File | null>(null);
  const [uploadingEpub, setUploadingEpub] = useState(false);

  const tocStats = useMemo(() => {
    const lines = tocText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    return { lines: lines.length, chars: tocText.length };
  }, [tocText]);

  const fetchBook = async () => {
    if (!isUuid(bookId)) {
      setError("잘못된 워크스페이스 ID입니다.");
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
      await loadSections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    }
  };

  const loadSections = async () => {
    if (!isUuid(bookId)) {
      return;
    }
    setLoadingSections(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        return;
      }
      const res = await fetch(`/api/books/${bookId}/sections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        return;
      }
      const payload = await res.json();
      setSections(payload.items ?? []);
    } finally {
      setLoadingSections(false);
    }
  };

  useEffect(() => {
    void fetchBook();
  }, [bookId]);

  const updateBook = async (payload: Record<string, string>) => {
    if (!isUuid(bookId)) {
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
    setTocResult(null);
    try {
      await updateBook({ toc_text: tocText });
      setNotice("TOC가 저장되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setSavingToc(false);
    }
  };

  const runTocParse = async (force = false) => {
    if (!isUuid(bookId)) {
      return;
    }
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      throw new Error("로그인이 필요합니다.");
    }
    const res = await fetch(`/api/books/${bookId}/toc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ toc_text: tocText, force }),
    });

    if (res.status === 409) {
      const payload = await res.json();
      const confirmed = confirm(
        `기존 섹션(${payload.sectionCount})/청크(${payload.chunkCount})가 있습니다. 삭제하고 재생성할까요?`,
      );
      if (confirmed) {
        return runTocParse(true);
      }
      return null;
    }

    if (!res.ok) {
      const payload = await res.json();
      throw new Error(payload.error ?? "TOC 파싱 실패");
    }

    return res.json();
  };

  const handleTocParse = async () => {
    setParsingToc(true);
    setNotice(null);
    setError(null);
    setTocResult(null);
    try {
      const payload = await runTocParse();
      if (payload?.created) {
        setTocResult(`섹션 ${payload.created}개 생성 완료`);
      }
      await loadSections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setParsingToc(false);
    }
  };

  const uploadEpub = async (force = false) => {
    if (!isUuid(bookId) || !epubFile) {
      return null;
    }
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      throw new Error("로그인이 필요합니다.");
    }

    const formData = new FormData();
    formData.append("file", epubFile);
    if (force) {
      formData.append("force", "true");
    }

    const res = await fetch(`/api/books/${bookId}/epub`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.status === 409) {
      const payload = await res.json();
      const confirmed = confirm(
        `기존 섹션(${payload.sectionCount})/청크(${payload.chunkCount})가 있습니다. 삭제하고 재생성할까요?`,
      );
      if (confirmed) {
        return uploadEpub(true);
      }
      return null;
    }

    if (!res.ok) {
      const payload = await res.json();
      throw new Error(payload.error ?? "EPUB 업로드 실패");
    }

    return res.json();
  };

  const handleEpubUpload = async () => {
    if (!epubFile) {
      setError("업로드할 EPUB 파일을 선택하세요.");
      return;
    }
    setUploadingEpub(true);
    setNotice(null);
    setError(null);
    setTocResult(null);
    try {
      const payload = await uploadEpub();
      if (payload?.toc_text) {
        setTocText(payload.toc_text);
        setTocResult(`EPUB 파싱 완료: 섹션 ${payload.created ?? 0}개`);
      }
      await loadSections();
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setUploadingEpub(false);
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
        <h3 className="text-sm font-semibold text-zinc-200">EPUB 업로드</h3>
        <p className="mt-2 text-xs text-zinc-500">
          업로드 후 자동으로 TOC를 파싱하고 섹션을 생성합니다.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".epub"
            onChange={(event) =>
              setEpubFile(event.target.files ? event.target.files[0] : null)
            }
            className="text-xs text-zinc-300"
          />
          <button
            onClick={handleEpubUpload}
            disabled={uploadingEpub || !epubFile}
            className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-900 disabled:opacity-60"
          >
            {uploadingEpub ? "업로드 중..." : "EPUB 업로드"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">섹션 트리</h3>
          <button
            onClick={loadSections}
            className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs text-zinc-200"
          >
            새로고침
          </button>
        </div>
        {loadingSections ? (
          <p className="mt-3 text-xs text-zinc-500">불러오는 중...</p>
        ) : null}
        <div className="mt-3 space-y-2">
          {sections.map((section) => (
            <div
              key={section.id}
              style={{ paddingLeft: `${section.depth * 16}px` }}
              className="text-sm text-zinc-200"
            >
              {section.title}
            </div>
          ))}
          {!loadingSections && sections.length === 0 ? (
            <p className="text-xs text-zinc-500">아직 섹션이 없습니다.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">TOC (목차)</h3>
          <p className="text-xs text-zinc-500">
            {tocStats.lines} lines · {tocStats.chars} chars
          </p>
        </div>
        {tocResult ? (
          <p className="mt-2 text-xs text-emerald-300">{tocResult}</p>
        ) : null}
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
            onClick={handleTocParse}
            disabled={parsingToc}
            className="rounded-full border border-emerald-500/60 px-4 py-1.5 text-xs text-emerald-200 disabled:opacity-60"
          >
            {parsingToc ? "파싱 중..." : "섹션 생성"}
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
