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
