export default function ArtifactsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">아티팩트 라이브러리</h2>
        <p className="mt-2 text-sm text-zinc-400">
          체크리스트, 결정 가이드 등 생성된 산출물을 관리합니다.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
        <p className="text-xs text-zinc-500">
          책별/전역 아티팩트 전환 탭과 생성 버튼이 들어갈 영역입니다.
        </p>
      </div>
    </div>
  );
}
