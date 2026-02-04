import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validators/uuid";
import { chunkTextByParagraphs } from "@/lib/ingest/chunk";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: { id: string } },
) {
  const { error } = await requireUser(request);
  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { id } = await Promise.resolve(context.params);
  if (!isUuid(id)) {
    return NextResponse.json({ error: "invalid book id" }, { status: 400 });
  }

  const body = await request.json();
  const sectionId = typeof body.section_id === "string" ? body.section_id : "";
  const text = typeof body.text === "string" ? body.text : "";
  const maxChars = Number.isFinite(body.max_chars) ? Number(body.max_chars) : 2000;

  if (!isUuid(sectionId)) {
    return NextResponse.json({ error: "invalid section id" }, { status: 400 });
  }
  if (!text.trim()) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  const { data: section, error: sectionError } = await supabaseAdmin
    .from("sections")
    .select("id,book_id")
    .eq("id", sectionId)
    .single();

  if (sectionError || !section) {
    return NextResponse.json({ error: "section not found" }, { status: 404 });
  }
  if (section.book_id !== id) {
    return NextResponse.json({ error: "section does not belong to book" }, { status: 400 });
  }

  const { data: lastChunk } = await supabaseAdmin
    .from("chunks")
    .select("chunk_index")
    .eq("section_id", sectionId)
    .order("chunk_index", { ascending: false })
    .limit(1)
    .maybeSingle();

  const startIndex = lastChunk?.chunk_index ? lastChunk.chunk_index + 1 : 0;
  const chunks = chunkTextByParagraphs(text, maxChars);

  const rows = chunks.map((chunk, idx) => ({
    book_id: id,
    section_id: sectionId,
    chunk_index: startIndex + idx,
    text: chunk.text,
    start_offset: chunk.start_offset,
    end_offset: chunk.end_offset,
    hash: createHash("sha256").update(chunk.text).digest("hex"),
  }));

  const { error: insertError } = await supabaseAdmin
    .from("chunks")
    .insert(rows);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: rows.length });
}
