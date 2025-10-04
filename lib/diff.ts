export type DiffLine = {
  type: "context" | "added" | "removed";
  old: number | "";
  new: number | "";
  text: string;
};

export function parseUnifiedPatch(patch: string | null | undefined): DiffLine[] {
  if (!patch) return [];
  const lines = patch.split("\n");
  const result: DiffLine[] = [];
  let oldNum = 0;
  let newNum = 0;

  const hunkRe = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

  for (const raw of lines) {
    if (raw.startsWith("---") || raw.startsWith("+++") || raw.startsWith("diff --git") || raw.startsWith("index")) {
      continue;
    }
    const m = raw.match(hunkRe);
    if (m) {
      oldNum = parseInt(m[1], 10);
      newNum = parseInt(m[2], 10);
      continue;
    }
    if (raw.startsWith("+")) {
      result.push({ type: "added", old: "", new: newNum, text: raw.slice(1) });
      newNum += 1;
    } else if (raw.startsWith("-")) {
      result.push({ type: "removed", old: oldNum, new: "", text: raw.slice(1) });
      oldNum += 1;
    } else {
      const text = raw.startsWith(" ") ? raw.slice(1) : raw;
      result.push({ type: "context", old: oldNum, new: newNum, text });
      oldNum += 1;
      newNum += 1;
    }
  }
  return result;
}

export function mapLineToIndex(lines: DiffLine[], side: "LEFT" | "RIGHT", line: number): number | null {
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (side === "RIGHT") {
      if (typeof ln.new === "number" && ln.new === line) return i;
    } else {
      if (typeof ln.old === "number" && ln.old === line) return i;
    }
  }
  return null;
}