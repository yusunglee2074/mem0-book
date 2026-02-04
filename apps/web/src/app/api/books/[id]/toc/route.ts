import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ParsedSection = {
  id: string;
  book_id: string;
  parent_id: string | null;
  title: string;
  order_index: number;
  depth: number;
  toc_path: string;
};

function parseToc(tocText: string, bookId: string) {
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

export async function POST(
  request: Request,
  context: { params: { id: string } },
) {
  const { error } = await requireUser(request);
  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { id } = context.params;
  let payload: { toc_text?: string; force?: boolean } = {};

  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  if (typeof payload.toc_text === "string") {
    const { error: updateError } = await supabaseAdmin
      .from("books")
      .update({ toc_text: payload.toc_text })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  const { data: book, error: bookError } = await supabaseAdmin
    .from("books")
    .select("toc_text")
    .eq("id", id)
    .single();

  if (bookError) {
    return NextResponse.json({ error: bookError.message }, { status: 404 });
  }

  const tocText = (book?.toc_text ?? "").trim();
  if (!tocText) {
    return NextResponse.json({ error: "toc_text is empty" }, { status: 400 });
  }

  const { count: sectionCount } = await supabaseAdmin
    .from("sections")
    .select("id", { count: "exact", head: true })
    .eq("book_id", id);

  const { count: chunkCount } = await supabaseAdmin
    .from("chunks")
    .select("id", { count: "exact", head: true })
    .eq("book_id", id);

  const hasExisting = (sectionCount ?? 0) > 0 || (chunkCount ?? 0) > 0;
  if (hasExisting && payload.force !== true) {
    return NextResponse.json(
      {
        error: "existing_sections",
        message: "기존 섹션/청크가 있습니다. force=true로 다시 시도하세요.",
        sectionCount: sectionCount ?? 0,
        chunkCount: chunkCount ?? 0,
      },
      { status: 409 },
    );
  }

  if (hasExisting) {
    const { error: deleteError } = await supabaseAdmin
      .from("sections")
      .delete()
      .eq("book_id", id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }
  }

  const sections = parseToc(tocText, id);
  if (sections.length === 0) {
    return NextResponse.json({ error: "No sections parsed." }, { status: 400 });
  }

  const { error: insertError } = await supabaseAdmin
    .from("sections")
    .insert(sections);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    created: sections.length,
    sectionCount: sectionCount ?? 0,
    chunkCount: chunkCount ?? 0,
  });
}
