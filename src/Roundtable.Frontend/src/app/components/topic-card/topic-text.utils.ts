export function getTopicTags(tags: string | null | undefined): string[] {
  if (!tags?.trim()) return [];
  return tags
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.toUpperCase());
}

export function getTopicReferenceDocuments(json: string | null | undefined): string[] {
  const j = json?.trim();
  if (!j) return [];
  try {
    const arr = JSON.parse(j) as unknown;
    return Array.isArray(arr) ? arr.filter((v): v is string => typeof v === 'string' && v.trim() !== '') : [];
  } catch {
    return [];
  }
}

/** Segments of text with match flags for search highlighting (case-insensitive). */
export function getHighlightedSegments(
  text: string | null | undefined,
  query: string,
): { text: string; match: boolean }[] {
  const str = text ?? '';
  const q = query?.trim();
  if (!q) return [{ text: str, match: false }];
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(${escaped})`, 'gi');
  const segments: { text: string; match: boolean }[] = [];
  let lastIndex = 0;
  for (const m of str.matchAll(re)) {
    if (m.index! > lastIndex) {
      segments.push({ text: str.slice(lastIndex, m.index), match: false });
    }
    segments.push({ text: m[1], match: true });
    lastIndex = m.index! + m[0].length;
  }
  if (lastIndex < str.length) {
    segments.push({ text: str.slice(lastIndex), match: false });
  }
  return segments.length ? segments : [{ text: str, match: false }];
}

const topicNotesPreviewMaxLines = 3;
const topicNotesPreviewMaxChars = 280;

export function topicNotesIsTruncated(notes: string | null | undefined): boolean {
  if (!notes?.trim()) return false;
  const lines = notes.split(/\n/);
  if (lines.length > topicNotesPreviewMaxLines) return true;
  return notes.length > topicNotesPreviewMaxChars;
}

export function topicNotesPreview(notes: string | null | undefined): string {
  if (!notes) return '';
  const maxL = topicNotesPreviewMaxLines;
  const maxC = topicNotesPreviewMaxChars;
  const lines = notes.split(/\n/);
  if (lines.length > maxL) {
    return lines.slice(0, maxL).join('\n') + '\n.....';
  }
  if (notes.length > maxC) {
    return notes.slice(0, maxC).trimEnd() + '.....';
  }
  return notes;
}
