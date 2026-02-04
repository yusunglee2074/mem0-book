import Link from "next/link";

export default function CorePage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">나의 지식</h2>
        <p className="mt-2 text-sm text-zinc-400">
          여러 책에서 승격된 핵심 개념을 통합 관리하는 전역 코어입니다.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 text-sm text-zinc-300">
        <Link href="/books" className="underline">
          워크스페이스 목록으로 이동
        </Link>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">코어 지식 목록</h3>
          <p className="mt-2 text-xs text-zinc-500">
            승격된 개념을 카드 형태로 나열합니다.
          </p>
        </section>
        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">출처 / 연결</h3>
          <p className="mt-2 text-xs text-zinc-500">
            어떤 책/챕터에서 올라온 개념인지 표시합니다.
          </p>
        </section>
      </div>
    </div>
  );
}
