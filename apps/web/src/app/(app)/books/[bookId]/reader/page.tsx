export default function ReaderPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">리더 + Q&A</h2>
        <p className="mt-2 text-sm text-zinc-400">
          TOC 탐색, 텍스트 읽기, 질문/답변 UI가 들어갈 영역입니다.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">리더</h3>
          <p className="mt-2 text-xs text-zinc-500">
            책 내용을 표시하고 하이라이트/주석 기능을 배치합니다.
          </p>
        </section>
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">질문 패널</h3>
          <p className="mt-2 text-xs text-zinc-500">
            Explain/Connect/Apply/Quiz 모드로 질문합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
