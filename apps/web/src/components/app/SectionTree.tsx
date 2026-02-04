"use client";

import type { SectionNode } from "@/lib/sections/tree";

interface SectionTreeProps {
  sections: SectionNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function renderNode(
  node: SectionNode,
  depth: number,
  selectedId: string | null,
  onSelect: (id: string) => void,
) {
  const isSelected = node.id === selectedId;
  return (
    <div key={node.id}>
      <button
        type="button"
        onClick={() => onSelect(node.id)}
        className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
          isSelected
            ? "bg-emerald-500/20 text-emerald-100"
            : "text-zinc-300 hover:bg-zinc-800/70"
        }`}
        style={{ paddingLeft: `${depth * 14 + 12}px` }}
      >
        {node.title}
      </button>
      {node.children.map((child) =>
        renderNode(child, depth + 1, selectedId, onSelect),
      )}
    </div>
  );
}

export default function SectionTree({
  sections,
  selectedId,
  onSelect,
}: SectionTreeProps) {
  return (
    <div className="space-y-1">
      {sections.length === 0 ? (
        <p className="text-xs text-zinc-500">섹션이 없습니다.</p>
      ) : (
        sections.map((node) =>
          renderNode(node, 0, selectedId, onSelect),
        )
      )}
    </div>
  );
}
