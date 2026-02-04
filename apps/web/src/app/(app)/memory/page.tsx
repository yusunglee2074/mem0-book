export default function MemoryPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">메모리 인스펙터</h2>
        <p className="mt-2 text-sm text-zinc-400">
          추출된 메모리 목록과 수정/핀/비활성 기능이 들어갑니다.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
        <p className="text-xs text-zinc-500">
          필터, 검색, 섹션별 그룹핑 UI를 추가할 예정입니다.
        </p>
        <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
          <p className="text-xs text-zinc-400">
            선택한 메모리를 전역 코어 지식으로 승격할 수 있습니다.
          </p>
          <button className="mt-3 rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-900">
            코어로 승격
          </button>
        </div>
      </div>
    </div>
  );
}
