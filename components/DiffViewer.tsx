"use client";

import { useMemo, useRef, useState } from "react";
import { GitCommit, MessageSquare } from "lucide-react";
import { Comment, DiffFile } from "../lib/types";

type DiffLine = {
  type: "context" | "added" | "removed";
  old: number | "" ;
  new: number | "" ;
  text: string;
};

type Props = {
  filePath?: string;
  diffFiles: DiffFile[];
  comments: Comment[];
  onAddComment: (lineIndex: number, text: string) => void;
};

function parseUnifiedPatch(patch: string | null | undefined): DiffLine[] {
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

export default function DiffViewer({ filePath, diffFiles, comments, onAddComment }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const activeFile: DiffFile | undefined = useMemo(() => {
    if (!diffFiles?.length) return undefined;
    if (filePath) {
      const found = diffFiles.find(f => f.filename === filePath);
      if (found) return found;
    }
    return diffFiles[0];
  }, [diffFiles, filePath]);

  const lines = useMemo(() => parseUnifiedPatch(activeFile?.patch || null), [activeFile]);

  return (
    <div className="view view-diff" aria-live="polite">
      <div className="diff-header">
        <div className="diff-file">
          <GitCommit className="icon" /> {activeFile?.filename || filePath || "Diff"}
        </div>
      </div>
      <div className="diff-lines">
        {lines.map((ln, idx) => {
          const thread = comments.filter(c => c.lineIndex === idx);
          return (
            <div key={`diff-${idx}`}>
              <div className={`diff-line ${ln.type}`} data-index={idx}>
                <div className="ln">{ln.old === "" ? "" : String(ln.old)}</div>
                <div className="ln">{ln.new === "" ? "" : String(ln.new)}</div>
                <div className="sign">{ln.type === "added" ? "+" : ln.type === "removed" ? "-" : " "}</div>
                <div className="code">{ln.text}</div>
                <button className="comment-btn" onClick={() => setOpenIdx(idx)} title="Comment">
                  <MessageSquare />
                </button>
              </div>

              {openIdx === idx && (
                <div
                  style={{
                    background: "#0d1320",
                    border: "1px solid #1f2937",
                    borderRadius: 10,
                    padding: 8,
                    margin: "6px 8px",
                    boxShadow: "0 10px 30px rgba(5,10,20,0.5)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#94a3b8", marginBottom: 6 }}>
                    <MessageSquare className="icon" /> Add review comment
                  </div>
                  <textarea
                    ref={textareaRef}
                    placeholder="Write a note for Atlas..."
                    style={{
                      width: "100%",
                      minHeight: 80,
                      background: "#0f1421",
                      border: "1px solid #1f2937",
                      color: "#e5e7eb",
                      borderRadius: 8,
                      padding: 8,
                      fontFamily: "var(--sans)"
                    }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                    <button className="btn" onClick={() => setOpenIdx(null)}>
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        const text = textareaRef.current?.value || "";
                        if (!text.trim()) return;
                        onAddComment(idx, text.trim());
                        setOpenIdx(null);
                      }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {thread.length > 0 && (
                <div
                  style={{
                    background: "rgba(124,58,237,0.08)",
                    borderTop: "1px dashed #334155",
                    gridColumn: "1 / -1",
                    padding: "8px 12px",
                    fontFamily: "var(--sans)",
                    color: "#cbd5e1"
                  }}
                >
                  <strong>Comments:</strong>
                  <br />
                  {thread.map((t, i) => (
                    <div key={`c-${idx}-${i}`}>{t.text}</div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}