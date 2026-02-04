import { randomUUID } from "crypto";

export type ParsedSection = {
  id: string;
  book_id: string;
  parent_id: string | null;
  title: string;
  order_index: number;
  depth: number;
  toc_path: string;
};

export function parseToc(tocText: string, bookId: string) {
  const lines = tocText.split(/\r?\n/);
  const stack: { id: string; title: string }[] = [];
  const sections: ParsedSection[] = [];
  let orderIndex = 0;

  for (const rawLine of lines) {
    if (!rawLine.trim()) {
      continue;
    }

    const indentMatch = rawLine.match(/^\s+/);
    const indentSize = indentMatch
      ? indentMatch[0].replace(/\t/g, "  ").length
      : 0;

    let trimmed = rawLine.trim();
    trimmed = trimmed.replace(/^[-*•]\s+/, "");

    let depth = Math.floor(indentSize / 2);

    const numberingMatch = trimmed.match(/^(\d+(?:\.\d+)*)\s+/);
    if (numberingMatch) {
      depth = numberingMatch[1].split(".").length - 1;
      trimmed = trimmed.slice(numberingMatch[0].length).trim();
    }

    if (!trimmed) {
      continue;
    }

    if (depth < 0) {
      depth = 0;
    }
    if (depth > stack.length) {
      depth = stack.length;
    }

    stack.length = depth;

    const parent = depth > 0 ? stack[depth - 1] : null;
    const id = randomUUID();
    const tocPath = [...stack.map((entry) => entry.title), trimmed].join(" > ");

    sections.push({
      id,
      book_id: bookId,
      parent_id: parent?.id ?? null,
      title: trimmed,
      order_index: orderIndex,
      depth,
      toc_path: tocPath,
    });

    stack[depth] = { id, title: trimmed };
    orderIndex += 1;
  }

  return sections;
}
