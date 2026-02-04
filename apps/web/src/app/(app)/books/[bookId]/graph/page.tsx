export default function GraphPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">컨셉트 그래프</h2>
        <p className="mt-2 text-sm text-zinc-400">
          개념 노드와 관계를 시각화하는 그래프 화면입니다.
        </p>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4">
        <p className="text-xs text-zinc-500">
          그래프 렌더링 캔버스 및 노드 상세 패널이 들어갑니다.
        </p>
      </div>
    </div>
  );
}
