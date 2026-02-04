export type ChunkInput = {
  text: string;
  start_offset: number;
  end_offset: number;
};

export function chunkTextByParagraphs(
  text: string,
  maxChars = 2000,
  minChars = 400,
) {
  const normalized = text.replace(/\r\n/g, "\n");
  const paragraphs: { start: number; end: number }[] = [];
  let cursor = 0;
  const separator = /\n\s*\n/g;
  let match: RegExpExecArray | null;

  while ((match = separator.exec(normalized)) !== null) {
    const end = match.index;
    if (end > cursor) {
      paragraphs.push({ start: cursor, end });
    }
    cursor = match.index + match[0].length;
  }

  if (cursor < normalized.length) {
    paragraphs.push({ start: cursor, end: normalized.length });
  }

  const chunks: ChunkInput[] = [];
  let chunkStart = -1;
  let chunkEnd = -1;
  let bufferLength = 0;

  const flush = () => {
    if (chunkStart >= 0 && chunkEnd >= 0) {
      const slice = normalized.slice(chunkStart, chunkEnd).trim();
      if (slice) {
        chunks.push({
          text: slice,
          start_offset: chunkStart,
          end_offset: chunkEnd,
        });
      }
    }
    chunkStart = -1;
    chunkEnd = -1;
    bufferLength = 0;
  };

  for (const paragraph of paragraphs) {
    const segment = normalized.slice(paragraph.start, paragraph.end).trim();
    if (!segment) {
      continue;
    }

    const segmentLength = segment.length;
    if (chunkStart === -1) {
      chunkStart = paragraph.start;
      chunkEnd = paragraph.end;
      bufferLength = segmentLength;
      continue;
    }

    const nextLength = bufferLength + 2 + segmentLength;
    if (nextLength > maxChars && bufferLength >= minChars) {
      flush();
      chunkStart = paragraph.start;
      chunkEnd = paragraph.end;
      bufferLength = segmentLength;
      continue;
    }

    chunkEnd = paragraph.end;
    bufferLength = nextLength;
  }

  flush();
  return chunks;
}
