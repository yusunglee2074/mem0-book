import { NextResponse } from "next/server";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validators/uuid";

export async function GET(
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

  const { searchParams } = new URL(request.url);
  const sectionId = searchParams.get("section_id");

  let query = supabaseAdmin
    .from("chunks")
    .select("id,section_id,chunk_index,text,start_offset,end_offset,created_at")
    .eq("book_id", id)
    .order("chunk_index", { ascending: true });

  if (sectionId) {
    if (!isUuid(sectionId)) {
      return NextResponse.json({ error: "invalid section id" }, { status: 400 });
    }
    query = query.eq("section_id", sectionId);
  }

  const { data, error: dbError } = await query;
  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
