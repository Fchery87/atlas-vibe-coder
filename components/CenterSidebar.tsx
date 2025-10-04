"use client";

import { useMemo } from "react";
import type { DiffFile, PrIssueComment } from "../lib/types";

type Props = {
  files: DiffFile[];
  selectedPath: string;
  onSelectPath: (p: string) => void;
  issueComments: PrIssueComment[];
};

function statusSymbol(status: string) {
  switch (status) {
    case "added":
      return "+";
    case "removed":
      return "-";
    default:
      return "M";
  }
}

export default function CenterSidebar({ files, selectedPath, onSelectPath, issueComments }: Props) {
  const sorted = useMemo(() => {
    const arr = [...files];
    arr.sort((a, b) => a.filename.localeCompare(b.filename));
    return arr;
  }, [files]);

  return (
    <aside className="center-sidebar" aria-label="Changed files and PR comments">
      <div className="sidebar-section">
        <div className="section-title">Changed Files</div>
        <div className="files-list">
          {sorted.length === 0 ? (
            <div className="muted">No changes</div>
          ) : (
            sorted.map((f) => (
              <button
                key={f.filename}
                className={`file-row ${selectedPath === f.filename ? "active" : ""}`}
                onClick={() => onSelectPath(f.filename)}
                title={f.filename}
              >
                <span className={`status ${f.status}`}>{statusSymbol(f.status)}</span>
                <span className="name">{f.filename}</span>
                <span className="metrics">
                  <span className="add">+{f.additions}</span>
                  <span className="del">-{f.deletions}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-title">PR Comments</div>
        <div className="comments-list">
          {issueComments.length === 0 ? (
            <div className="muted">No PR discussion yet</div>
          ) : (
            issueComments.map((c) => (
              <div key={c.id} className="comment-card">
                <div className="comment-meta">
                  <span className="author">{c.author || "Unknown"}</span>
                  {c.createdAt && <span className="time">{new Date(c.createdAt).toLocaleString()}</span>}
                </div>
                <div className="comment-body">{c.body}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}