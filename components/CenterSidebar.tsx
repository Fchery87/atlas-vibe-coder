"use client";

import { useMemo, useState } from "react";
import type { PrIssueComment, ReviewComment } from "../lib/types";

type Props = {
  issueComments: PrIssueComment[];
  reviewComments?: ReviewComment[];
  lastRefreshedTs?: string | null;
  autoRefreshEnabled?: boolean;
  onToggleAuto?: () => void;
  onRefresh?: () => void;
  onSelectPath?: (p: string) => void;
};

export default function CenterSidebar({
  issueComments,
  reviewComments = [],
  lastRefreshedTs,
  autoRefreshEnabled,
  onToggleAuto,
  onRefresh,
  onSelectPath
}: Props) {
  const [qComments, setQComments] = useState("");
  const [qReviews, setQReviews] = useState("");

  const filteredComments = useMemo(() => {
    if (!qComments.trim()) return issueComments;
    const s = qComments.toLowerCase();
    return issueComments.filter(c => (c.body || "").toLowerCase().includes(s) || (c.author || "").toLowerCase().includes(s));
  }, [issueComments, qComments]);

  const filteredReviews = useMemo(() => {
    if (!qReviews.trim()) return reviewComments;
    const s = qReviews.toLowerCase();
    return reviewComments.filter(
      r =>
        (r.body || "").toLowerCase().includes(s) ||
        (r.author || "").toLowerCase().includes(s) ||
        (r.path || "").toLowerCase().includes(s) ||
        String(r.line || "").includes(s)
    );
  }, [reviewComments, qReviews]);

  return (
    <aside className="center-sidebar" aria-label="PR comments">
      <div className="sidebar-section">
        <div className="section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span>PR Comments</span>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span className="muted" style={{ fontSize: 11 }}>
              Last refreshed: {lastRefreshedTs || "-"}
            </span>
            <button className="btn" onClick={onRefresh} title="Refresh comments">Refresh</button>
            {typeof autoRefreshEnabled === "boolean" && (
              <button className="btn" onClick={onToggleAuto} title={autoRefreshEnabled ? "Pause Auto-refresh" : "Resume Auto-refresh"}>
                {autoRefreshEnabled ? "Pause" : "Resume"}
              </button>
            )}
          </div>
        </div>
        <input
          placeholder="Filter comments…"
          value={qComments}
          onChange={e => setQComments(e.target.value)}
          style={{
            width: "100%",
            height: 30,
            borderRadius: 8,
            border: "1px solid #1f2937",
            background: "#0f1421",
            color: "#e5e7eb",
            padding: "0 8px",
            marginBottom: 6
          }}
        />
        <div className="comments-list">
          {filteredComments.length === 0 ? (
            <div className="muted">No PR discussion yet</div>
          ) : (
            filteredComments.map((c) => (
              <div key={c.id} className="comment-card">
                <div className="comment-meta">
                  <span className="author">{c.author || "Unknown"}</span>
                  <span>
                    {c.createdAt && <span className="time" style={{ marginRight: 8 }}>{new Date(c.createdAt).toLocaleString()}</span>}
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noreferrer" className="muted" style={{ textDecoration: "underline" }}>
                        View
                      </a>
                    )}
                  </span>
                </div>
                <div className="comment-body">{c.body}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-title">Review Comments</div>
        <input
          placeholder="Filter review comments…"
          value={qReviews}
          onChange={e => setQReviews(e.target.value)}
          style={{
            width: "100%",
            height: 30,
            borderRadius: 8,
            border: "1px solid #1f2937",
            background: "#0f1421",
            color: "#e5e7eb",
            padding: "0 8px",
            marginBottom: 6
          }}
        />
        <div className="comments-list">
          {filteredReviews.length === 0 ? (
            <div className="muted">No review comments yet</div>
          ) : (
            filteredReviews.map((r) => (
              <div key={r.id} className="comment-card">
                <div className="comment-meta">
                  <span className="author">{r.author || "Reviewer"}</span>
                  <span>
                    {r.createdAt && <span className="time" style={{ marginRight: 8 }}>{new Date(r.createdAt).toLocaleString()}</span>}
                    <button
                      className="btn"
                      title="Open file"
                      onClick={() => onSelectPath?.(r.path)}
                      style={{ height: 22, padding: "0 8px" }}
                    >
                      View file
                    </button>
                  </span>
                </div>
                <div className="comment-body">
                  <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>{r.path}:{r.line} {r.side ? `(${r.side})` : ""}</div>
                  {r.body}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}