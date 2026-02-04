import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { requireUser, supabaseAdmin } from "@/lib/supabase/server";
import { parseToc } from "@/lib/toc/parse";
import { isUuid } from "@/lib/validators/uuid";

export const runtime = "nodejs";

type ParsedEpub = {
  title?: string | null;
  author?: string | null;
  language?: string | null;
  toc_text?: string | null;
};

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function execFileAsync(command: string, args: string[]) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    execFile(command, args, { timeout: 30000 }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

async function parseEpub(filePath: string) {
  const scriptPath = path.resolve(
    process.cwd(),
    "..",
    "..",
    "workers",
    "epub",
    "src",
    "parse_epub.py",
  );

  const { stdout } = await execFileAsync("python3", [scriptPath, filePath]);
  return JSON.parse(stdout) as ParsedEpub;
}

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
  const formData = await request.formData();
  const file = formData.get("file");
  const force = formData.get("force") === "true";

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".epub")) {
    return NextResponse.json({ error: "Only .epub files are supported" }, { status: 400 });
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "book-epubs";
  const buffer = Buffer.from(await file.arrayBuffer());
  const hash = createHash("sha256").update(buffer).digest("hex");
  const filename = sanitizeFilename(file.name);
  const storagePath = `books/${id}/${Date.now()}_${filename}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType: file.type || "application/epub+zip",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: bookFile, error: fileError } = await supabaseAdmin
    .from("book_files")
    .insert({
      book_id: id,
      bucket,
      path: storagePath,
      filename,
      size_bytes: buffer.length,
      sha256: hash,
      parse_status: "pending",
    })
    .select("id")
    .single();

  if (fileError) {
    return NextResponse.json({ error: fileError.message }, { status: 500 });
  }

  const tmpPath = path.join(os.tmpdir(), `${hash}.epub`);
  await fs.writeFile(tmpPath, buffer);

  let parsed: ParsedEpub | null = null;

  try {
    parsed = await parseEpub(tmpPath);
  } catch (err) {
    await supabaseAdmin
      .from("book_files")
      .update({ parse_status: "failed" })
      .eq("id", bookFile.id);
    return NextResponse.json({ error: "EPUB parsing failed" }, { status: 500 });
  } finally {
    await fs.unlink(tmpPath).catch(() => undefined);
  }

  const tocText = (parsed?.toc_text ?? "").trim();
  if (!tocText) {
    await supabaseAdmin
      .from("book_files")
      .update({ parse_status: "parsed" })
      .eq("id", bookFile.id);
    return NextResponse.json({
      status: "parsed",
      toc_text: "",
      message: "TOC를 찾지 못했습니다.",
    });
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
  if (hasExisting && !force) {
    return NextResponse.json(
      {
        error: "existing_sections",
        message: "기존 섹션/청크가 있습니다. force=true로 다시 시도하세요.",
        sectionCount: sectionCount ?? 0,
        chunkCount: chunkCount ?? 0,
        toc_text: tocText,
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
  const { error: insertError } = await supabaseAdmin
    .from("sections")
    .insert(sections);

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await supabaseAdmin
    .from("books")
    .update({ toc_text: tocText })
    .eq("id", id);

  await supabaseAdmin
    .from("book_files")
    .update({ parse_status: "parsed" })
    .eq("id", bookFile.id);

  return NextResponse.json({
    status: "parsed",
    toc_text: tocText,
    created: sections.length,
  });
}
