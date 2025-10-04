"use client";

import { useMemo, useState } from "react";
import type { PrIssueComment } from "../lib/types";

type Props = {
  issueComments: PrIssueComment[];
  onRefresh?: () => void;
};

export default function CenterSidebar({ issueComments, onRefresh }: Props) {
  const [qComments, setQComments] = useState("");

  const filteredComments = useMemo(() => {
    if (!qComments.trim()) return issueComments;
    const s = qComments.toLowerCase();
    return issueComments.filter(c => (c.body || "").toLowerCase().includes(s) || (c.author || "").toLowerCase().includes(s));
  }, [issueComments, qComments]);

  return (
    <aside className="center-sidebar" aria-label="PR comments">
      <div className="sidebar-section">
        <div className="section-title" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>PR Comments</span>
          <button className="btn" onClick={onRefresh} title="Refresh comments">Refresh</button>
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
    </aside>
  );
}