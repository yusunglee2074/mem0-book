import { NextResponse } from "next/server";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  context: { params: { id: string } },
) {
  const { error } = await requireUser(request);
  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }

  const { id } = context.params;
  const { data, error: dbError } = await supabaseAdmin
    .from("sections")
    .select("id,parent_id,title,order_index,depth,toc_path")
    .eq("book_id", id)
    .order("order_index", { ascending: true });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
