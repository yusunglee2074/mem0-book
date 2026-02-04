import { NextResponse } from "next/server";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validators/uuid";

export async function GET(request: Request, context: { params: { id: string } }) {
  const { error } = await requireUser(request);
  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { id } = await Promise.resolve(context.params);
  if (!isUuid(id)) {
    return NextResponse.json({ error: "invalid book id" }, { status: 400 });
  }
  const { data, error: dbError } = await supabaseAdmin
    .from("books")
    .select("id,title,author,language,toc_text,created_at")
    .eq("id", id)
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 404 });
  }

  return NextResponse.json({ item: data });
}

export async function PATCH(request: Request, context: { params: { id: string } }) {
  const { error } = await requireUser(request);
  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const body = await request.json();
  const updates: Record<string, string | null> = {};

  if (typeof body.title === "string") {
    const nextTitle = body.title.trim();
    if (!nextTitle) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }
    updates.title = nextTitle;
  }
  if (typeof body.author === "string") {
    const nextAuthor = body.author.trim();
    updates.author = nextAuthor.length > 0 ? nextAuthor : null;
  }
  if (typeof body.language === "string") {
    const nextLanguage = body.language.trim();
    updates.language = nextLanguage.length > 0 ? nextLanguage : "ko";
  }
  if (typeof body.toc_text === "string") {
    updates.toc_text = body.toc_text;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { id } = await Promise.resolve(context.params);
  if (!isUuid(id)) {
    return NextResponse.json({ error: "invalid book id" }, { status: 400 });
  }
  const { data, error: dbError } = await supabaseAdmin
    .from("books")
    .update(updates)
    .eq("id", id)
    .select("id,title,author,language,toc_text,created_at")
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const { error } = await requireUser(request);
  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { id } = await Promise.resolve(context.params);
  if (!isUuid(id)) {
    return NextResponse.json({ error: "invalid book id" }, { status: 400 });
  }
  const { error: dbError } = await supabaseAdmin.from("books").delete().eq("id", id);

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
