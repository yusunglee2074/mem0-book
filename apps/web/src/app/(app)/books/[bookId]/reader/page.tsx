import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isUuid } from "@/lib/validators/uuid";

type Section = {
  id: string;
  title: string;
  depth: number;
};

type Chunk = {
  id: string;
  chunk_index: number;
  text: string;
  created_at: string;
};

export default function ReaderPage() {
  const params = useParams();
  const bookId = Array.isArray(params.bookId)
    ? params.bookId[0]
    : (params.bookId as string | undefined);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionId, setSectionId] = useState<string>("");
  const [rawText, setRawText] = useState("");
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loadingChunks, setLoadingChunks] = useState(false);
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSections = async () => {
    if (!isUuid(bookId)) {
      setError("잘못된 워크스페이스 ID입니다.");
      return;
    }
    setLoadingSections(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("로그인이 필요합니다.");
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
      if (!sectionId && payload.items?.length) {
        setSectionId(payload.items[0].id);
      }
    } finally {
      setLoadingSections(false);
    }
  };

  const loadChunks = async (targetSectionId: string) => {
    if (!isUuid(bookId) || !isUuid(targetSectionId)) {
      return;
    }
    setLoadingChunks(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("로그인이 필요합니다.");
        return;
      }
      const res = await fetch(
        `/api/books/${bookId}/chunks?section_id=${targetSectionId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        return;
      }
      const payload = await res.json();
      setChunks(payload.items ?? []);
    } finally {
      setLoadingChunks(false);
    }
  };

  useEffect(() => {
    void loadSections();
  }, [bookId]);

  useEffect(() => {
    if (sectionId) {
      void loadChunks(sectionId);
    }
  }, [sectionId]);

  const handleIngest = async () => {
    if (!isUuid(bookId) || !isUuid(sectionId)) {
      setError("섹션을 선택하세요.");
      return;
    }
    if (!rawText.trim()) {
      setError("텍스트를 입력하세요.");
      return;
    }
    setIngesting(true);
    setError(null);
    setNotice(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("로그인이 필요합니다.");
        return;
      }
      const res = await fetch(`/api/books/${bookId}/ingest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ section_id: sectionId, text: rawText }),
      });
      if (!res.ok) {
        const payload = await res.json();
        throw new Error(payload.error ?? "인제스트 실패");
      }
      const payload = await res.json();
      setNotice(`청크 ${payload.inserted ?? 0}개 저장 완료`);
      setRawText("");
      await loadChunks(sectionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
    } finally {
      setIngesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">리더 + Q&A</h2>
        <p className="mt-2 text-sm text-zinc-400">
          TOC 탐색, 텍스트 읽기, 질문/답변 UI가 들어갈 영역입니다.
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
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">텍스트 인제스트</h3>
          <p className="mt-2 text-xs text-zinc-500">
            섹션을 선택하고 텍스트를 붙여넣어 청크로 저장합니다.
          </p>
          <div className="mt-4 space-y-3">
            <select
              value={sectionId}
              onChange={(event) => setSectionId(event.target.value)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-white"
            >
              {loadingSections ? (
                <option>로딩 중...</option>
              ) : (
                sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {" ".repeat(section.depth * 2)}
                    {section.title}
                  </option>
                ))
              )}
            </select>
            <textarea
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              rows={10}
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-white"
              placeholder="챕터/섹션 본문을 붙여넣으세요."
            />
            <button
              onClick={handleIngest}
              disabled={ingesting}
              className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-900 disabled:opacity-60"
            >
              {ingesting ? "저장 중..." : "청크 저장"}
            </button>
          </div>
        </section>
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">청크 목록</h3>
          <p className="mt-2 text-xs text-zinc-500">
            선택된 섹션에 저장된 청크를 확인합니다.
          </p>
          <div className="mt-3 space-y-3">
            {loadingChunks ? (
              <p className="text-xs text-zinc-500">불러오는 중...</p>
            ) : null}
            {chunks.map((chunk) => (
              <div
                key={chunk.id}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-xs text-zinc-200"
              >
                <p className="text-zinc-400">#{chunk.chunk_index}</p>
                <p className="mt-2 line-clamp-4 whitespace-pre-wrap">
                  {chunk.text}
                </p>
              </div>
            ))}
            {!loadingChunks && chunks.length === 0 ? (
              <p className="text-xs text-zinc-500">청크가 없습니다.</p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}
