"use client";

import { useEffect, useMemo, useState } from "react";
import { List, Folder, Terminal as TerminalIcon, Link as LinkIcon, Settings as SettingsIcon, FileDiff, MessageSquare } from "lucide-react";
import { ToolKey } from "../lib/types";
import type { DiffFile, PrIssueComment, ReviewComment } from "../lib/types";

type TreeItem = { path?: string; type?: string; sha?: string };

type Props = {
  tool: ToolKey;
  setTool: (t: ToolKey) => void;
  branch: string;
  testOutput: string;
  onSelectPath?: (p: string) => void;
  selectedPath?: string;
  diffFiles?: DiffFile[];
  jiraIssueKey: string;
  setJiraIssueKey: (k: string) => void;
  autoRefreshEnabled: boolean;
  setAutoRefreshEnabled: (v: boolean) => void;
  refreshIntervalSec: number;
  setRefreshIntervalSec: (n: number) => void;

  issueComments?: PrIssueComment[];
  reviewComments?: ReviewComment[];
  lastRefreshedTs?: string | null;
  onRefresh?: () => void;
  onToggleAuto?: () => void;
};

export default function ToolDrawer({
  tool,
  setTool,
  branch,
  testOutput,
  onSelectPath,
  selectedPath,
  diffFiles = [],
  jiraIssueKey,
  setJiraIssueKey,
  autoRefreshEnabled,
  setAutoRefreshEnabled,
  refreshIntervalSec,
  setRefreshIntervalSec,
  issueComments = [],
  reviewComments = [],
  lastRefreshedTs,
  onRefresh,
  onToggleAuto
}: Props) {
  const [tree, setTree] = useState<TreeItem[]>([]);
  const [q, setQ] = useState("");
  const [showAdded, setShowAdded] = useState<boolean>(true);
  const [showModified, setShowModified] = useState<boolean>(true);
  const [showRemoved, setShowRemoved] = useState<boolean>(true);
  const [qc, setQc] = useState("");
  const [qr, setQr] = useState("");

  // GitHub integration (OAuth per-user)
  const [ghUser, setGhUser] = useState<any>(null);
  const [ghRepos, setGhRepos] = useState<any[]>([]);
  const [repoQ, setRepoQ] = useState<string>("");
  const [selectedRepo, setSelectedRepo] = useState<any | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>("");

  // Load persisted filters
  useEffect(() => {
    try {
      const a = localStorage.getItem("atlas_changed_show_added");
      const m = localStorage.getItem("atlas_changed_show_modified");
      const r = localStorage.getItem("atlas_changed_show_removed");
      if (a !== null) setShowAdded(a === "1" || a === "true");
      if (m !== null) setShowModified(m === "1" || m === "true");
      if (r !== null) setShowRemoved(r === "1" || r === "true");
    } catch {}
  }, []);

  // Persist filters
  useEffect(() => {
    try { localStorage.setItem("atlas_changed_show_added", showAdded ? "1" : "0"); } catch {}
  }, [showAdded]);
  useEffect(() => {
    try { localStorage.setItem("atlas_changed_show_modified", showModified ? "1" : "0"); } catch {}
  }, [showModified]);
  useEffect(() => {
    try { localStorage.setItem("atlas_changed_show_removed", showRemoved ? "1" : "0"); } catch {}
  }, [showRemoved]);

  useEffect(() => {
    if (tool !== "files") return;
    (async () => {
      try {
        const repoFull = typeof window !== "undefined" ? localStorage.getItem("atlas_repo_full_name") : null;
        const baseBranch = typeof window !== "undefined" ? localStorage.getItem("atlas_base_branch") : null;
        const params = new URLSearchParams();
        params.set("branch", baseBranch || branch);
        if (repoFull) params.set("full_name", repoFull);
        const res = await fetch(`/api/github/files?${params.toString()}`);
        const data = await res.json();
        setTree(Array.isArray(data.tree) ? data.tree : []);
      } catch {
        setTree([]);
      }
    })();
  }, [tool, branch]);

  // Load GitHub user on integrations tab open
  useEffect(() => {
    if (tool !== "integrations") return;
    (async () => {
      try {
        const res = await fetch("/api/github/user");
        if (res.ok) {
          setGhUser(await res.json());
        } else {
          setGhUser(null);
        }
      } catch {
        setGhUser(null);
      }
    })();
  }, [tool]);

  const filtered = useMemo(() => {
    if (!q.trim()) return tree;
    const qq = q.toLowerCase();
    return tree.filter(t => (t.path || "").toLowerCase().includes(qq));
  }, [tree, q]);

  const activeStatusClass =
    showAdded && !showModified && !showRemoved
      ? "added"
      : showModified && !showAdded && !showRemoved
      ? "modified"
      : showRemoved && !showAdded && !showModified
      ? "removed"
      : "";

  return (
    <>
      <nav className="tool-nav" aria-label="Tools">
        <button className={`tool-btn ${tool === "activity" ? "active" : ""}`} title="Activity Log" onClick={() => setTool("activity")}>
          <List />
        </button>
        <button className={`tool-btn ${tool === "comments" ? "active" : ""}`} title="PR Comments" onClick={() => setTool("comments")}>
          <MessageSquare />
        </button>
        <button className={`tool-btn ${tool === "changed" ? "active" : ""}`} title="Changed Files" onClick={() => setTool("changed")}>
          <FileDiff />
          {diffFiles?.length ? <span className={`tool-badge ${activeStatusClass}`}>{diffFiles.length}</span> : null}
        </button>
        <button className={`tool-btn ${tool === "files" ? "active" : ""}`} title="File Explorer" onClick={() => setTool("files")}>
          <Folder />
        </button>
        <button className={`tool-btn ${tool === "terminal" ? "active" : ""}`} title="Debugger / Terminal" onClick={() => setTool("terminal")}>
          <TerminalIcon />
        </button>
        <button className={`tool-btn ${tool === "integrations" ? "active" : ""}`} title="Integrations" onClick={() => setTool("integrations")}>
          <LinkIcon />
        </button>
        <button className={`tool-btn ${tool === "settings" ? "active" : ""}`} title="Settings" onClick={() => setTool("settings")}>
          <SettingsIcon />
        </button>
      </nav>

      <div id="toolDrawer" className={`tool-drawer ${tool ? "" : "hidden"}`} aria-label="Tool Drawer">
        {tool === "activity" && (
          <>
            <div className="tool-section">
              <h4>Global Activity</h4>
              <div className="muted">Recent tasks handled by Atlas will appear here.</div>
            </div>
            <div className="tool-section">
              <h4>Current Branch</h4>
              <div>{branch}</div>
            </div>
          </>
        )}

        {tool === "comments" && (
          <>
            <div className="tool-section">
              <h4>PR Comments</h4>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                <span className="muted" style={{ fontSize: 11 }}>
                  Last refreshed: {lastRefreshedTs || "-"}
                </span>
                <div style={{ display: "inline-flex", gap: 8 }}>
                  <button className="btn" onClick={onRefresh} title="Refresh comments">Refresh</button>
                  <button className="btn" onClick={onToggleAuto} title={autoRefreshEnabled ? "Pause Auto-refresh" : "Resume Auto-refresh"}>
                    {autoRefreshEnabled ? "Pause" : "Resume"}
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={qc}
                onChange={e => setQc(e.target.value)}
                placeholder="Filter comments…"
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
                {(issueComments || [])
                  .filter(c => {
                    const s = qc.trim().toLowerCase();
                    if (!s) return true;
                    return (c.body || "").toLowerCase().includes(s) || (c.author || "").toLowerCase().includes(s);
                  })
                  .map(c => {
                    const when = c.createdAt ? new Date(c.createdAt).toLocaleString() : "";
                    return (
                      <div key={c.id} className="comment-card">
                        <div className="comment-meta">
                          <span className="author">{c.author || "Unknown"}</span>
                          <span>
                            {when ? <span className="time" style={{ marginRight: 8 }}>{when}</span> : null}
                            {c.url ? (
                              <a href={c.url} target="_blank" rel="noreferrer" className="muted" style={{ textDecoration: "underline" }}>
                                View
                              </a>
                            ) : null}
                          </span>
                        </div>
                        <div className="comment-body">{c.body}</div>
                      </div>
                    );
                  })}
                {(issueComments || []).length === 0 && <div className="muted">No PR discussion yet</div>}
              </div>
            </div>

            <div className="tool-section">
              <h4>Review Comments</h4>
              <input
                type="text"
                value={qr}
                onChange={e => setQr(e.target.value)}
                placeholder="Filter review comments…"
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
                {(reviewComments || [])
                  .filter(r => {
                    const s = qr.trim().toLowerCase();
                    if (!s) return true;
                    return (
                      (r.body || "").toLowerCase().includes(s) ||
                      (r.author || "").toLowerCase().includes(s) ||
                      (r.path || "").toLowerCase().includes(s) ||
                      String(r.line || "").includes(s)
                    );
                  })
                  .map(r => {
                    const when = r.createdAt ? new Date(r.createdAt).toLocaleString() : "";
                    return (
                      <div key={r.id} className="comment-card">
                        <div className="comment-meta">
                          <span className="author">{r.author || "Reviewer"}</span>
                          <span>
                            {when ? <span className="time" style={{ marginRight: 8 }}>{when}</span> : null}
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
                          <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>
                            {r.path}:{r.line} {r.side ? `(${r.side})` : ""}
                          </div>
                          {r.body}
                        </div>
                      </div>
                    );
                  })}
                {(reviewComments || []).length === 0 && <div className="muted">No review comments yet</div>}
              </div>
            </div>
          </>
        )}

        {tool === "changed" && (
          <>
            <div className="tool-section">
              <h4>Changed Files</h4>
              <input
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Filter files..."
                style={{
                  width: "100%",
                  height: 30,
                  borderRadius: 8,
                  border: "1px solid #1f2937",
                  background: "#0f1421",
                  color: "#e5e7eb",
                  padding: "0 8px",
                  marginBottom: 8
                }}
              />
              {(() => {
                const filteredBySearch = (diffFiles || []).filter(f => !q.trim() || f.filename.toLowerCase().includes(q.toLowerCase()));
                const addedCount = filteredBySearch.filter(f => f.status === "added").length;
                const modifiedCount = filteredBySearch.filter(f => f.status === "modified").length;
                const removedCount = filteredBySearch.filter(f => f.status === "removed").length;
                return (
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <input type="checkbox" checked={showAdded} onChange={e => setShowAdded(e.target.checked)} />
                      <span style={{ color: "var(--success)" }}>Added</span>
                      <span className="muted">({addedCount})</span>
                    </label>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <input type="checkbox" checked={showModified} onChange={e => setShowModified(e.target.checked)} />
                      <span style={{ color: "var(--accent)" }}>Modified</span>
                      <span className="muted">({modifiedCount})</span>
                    </label>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <input type="checkbox" checked={showRemoved} onChange={e => setShowRemoved(e.target.checked)} />
                      <span style={{ color: "var(--error)" }}>Removed</span>
                      <span className="muted">({removedCount})</span>
                    </label>
                  </div>
                );
              })()}
            </div>
            <div className="tool-section file-list" style={{ maxHeight: "60vh", overflow: "auto" }}>
              {diffFiles
                .slice()
                .sort((a, b) => a.filename.localeCompare(b.filename))
                .filter(f => !q.trim() || f.filename.toLowerCase().includes(q.toLowerCase()))
                .filter(f => (showAdded && f.status === "added") || (showModified && f.status === "modified") || (showRemoved && f.status === "removed"))
                .map((f) => (
                  <button
                    key={f.filename}
                    className={`file-row ${f.status} ${selectedPath === f.filename ? "active" : ""}`}
                    title={f.filename}
                    onClick={() => onSelectPath?.(f.filename)}
                    style={{ width: "100%", textAlign: "left" }}
                  >
                    <span className={`status ${f.status}`}>{f.status === "added" ? "+" : f.status === "removed" ? "-" : "M"}</span>
                    <span className="name">{f.filename}</span>
                    <span className="metrics">
                      <span className="add">+{f.additions}</span>
                      <span className="del">-{f.deletions}</span>
                    </span>
                  </button>
                ))}
              {diffFiles.length === 0 && <div className="muted">No changes</div>}
            </div>
          </>
        )}
        {tool === "files" && (
          <>
            <div className="tool-section">
              <h4>File Explorer</h4>
              <input
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search repository..."
                style={{
                  width: "100%",
                  height: 30,
                  borderRadius: 8,
                  border: "1px solid #1f2937",
                  background: "#0f1421",
                  color: "#e5e7eb",
                  padding: "0 8px"
                }}
              />
            </div>
            <div className="tool-section file-list" style={{ maxHeight: "60vh", overflow: "auto" }}>
              {filtered.length === 0 ? (
                <div className="muted">No files</div>
              ) : (
                filtered.map((t, i) => (
                  <div
                    key={`tree-${i}`}
                    style={{ padding: "4px 6px", cursor: "pointer" }}
                    onClick={() => t.path && onSelectPath?.(t.path)}
                  >
                    {t.path}
                  </div>
                ))
              )}
            </div>
          </>
        )}
        {tool === "terminal" && (
          <div className="tool-section">
            <h4>Live Terminal</h4>
            <pre className="test-output">{`> jest --coverage\n${testOutput}`}</pre>
          </div>
        )}
        {tool === "integrations" && (
          <>
            <div className="tool-section">
              <h4>GitHub</h4>
              {!ghUser ? (
                <>
                  <div className="muted">Connect your GitHub account to browse repos, select a project, and create PRs.</div>
                  <div style={{ marginTop: 8 }}>
                    <button
                      className="btn"
                      onClick={() => {
                        // Start OAuth flow
                        window.location.href = "/api/auth/github/authorize";
                      }}
                    >
                      <LinkIcon className="icon" /> Connect GitHub
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="muted" style={{ marginBottom: 8 }}>
                    Connected as <strong>{ghUser.login}</strong>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center" }}>
                    <input
                      type="text"
                      value={repoQ}
                      onChange={e => setRepoQ(e.target.value)}
                      placeholder="Search repositories..."
                      style={{
                        width: "100%",
                        height: 30,
                        borderRadius: 8,
                        border: "1px solid #1f2937",
                        background: "#0f1421",
                        color: "#e5e7eb",
                        padding: "0 8px"
                      }}
                    />
                    <button
                      className="btn"
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/github/repos");
                          const data = await res.json();
                          setGhRepos(Array.isArray(data.repos) ? data.repos : []);
                        } catch {
                          setGhRepos([]);
                        }
                      }}
                    >
                      Load repos
                    </button>
                  </div>

                  <div className="tool-section file-list" style={{ maxHeight: "32vh", overflow: "auto", marginTop: 8 }}>
                    {ghRepos
                      .filter(r => !repoQ.trim() || (r.full_name || "").toLowerCase().includes(repoQ.toLowerCase()))
                      .slice(0, 100)
                      .map(r => (
                        <button
                          key={r.id}
                          className={`file-row ${selectedRepo?.full_name === r.full_name ? "active" : ""}`}
                          title={r.full_name}
                          onClick={async () => {
                            setSelectedRepo(r);
                            setBranches([]);
                            setSelectedBranch("");
                            try {
                              const res = await fetch(`/api/github/branches?full_name=${encodeURIComponent(r.full_name)}`);
                              const data = await res.json();
                              const bs = Array.isArray(data.branches) ? data.branches : [];
                              setBranches(bs);
                              setSelectedBranch(r.default_branch || bs[0] || "");
                            } catch {
                              setBranches([]);
                            }
                          }}
                          style={{ width: "100%", textAlign: "left" }}
                        >
                          <span className="name">{r.full_name}</span>
                          <span className="metrics">{r.private ? "private" : "public"}</span>
                        </button>
                      ))}
                    {ghRepos.length === 0 && <div className="muted">No repositories loaded</div>}
                  </div>

                  {selectedRepo && (
                    <div className="tool-section">
                      <h4>Workspace</h4>
                      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "center", gap: 8 }}>
                        <span className="muted">Repo</span>
                        <div>{selectedRepo.full_name}</div>
                        <span className="muted">Branch</span>
                        <select
                          value={selectedBranch}
                          onChange={e => setSelectedBranch(e.target.value)}
                          style={{
                            height: 30,
                            borderRadius: 8,
                            border: "1px solid #1f2937",
                            background: "#0f1421",
                            color: "#e5e7eb",
                            padding: "0 8px"
                          }}
                        >
                          {branches.map(b => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <button
                          className="btn"
                          onClick={() => {
                            try {
                              localStorage.setItem("atlas_repo_full_name", selectedRepo.full_name);
                              localStorage.setItem("atlas_base_branch", selectedBranch || selectedRepo.default_branch || "main");
                            } catch {}
                            alert("Workspace set. This repo/branch will be used for diffs & PRs.");
                          }}
                        >
                          Use this project
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="tool-section">
              <h4>Other Integrations</h4>
              <div className="muted">JIRA • Slack</div>
              <div style={{ marginTop: 8 }}>
                <button className="btn" style={{ marginRight: 8 }}>
                  <LinkIcon className="icon" /> Connect Slack
                </button>
              </div>
            </div>
          </>
        )}
        {tool === "settings" && (
          <div className="tool-section">
            <h4>Agent Settings</h4>
            <label className="muted" style={{ display: "block", marginBottom: 6 }}>
              Autonomy Level
            </label>
            <select
              style={{
                width: "100%",
                height: 34,
                borderRadius: 8,
                border: "1px solid #1f2937",
                background: "#0f1421",
                color: "#e5e7eb",
                padding: "0 8px"
              }}
            >
              <option>Conservative</option>
              <option defaultValue="Balanced">Balanced</option>
              <option>Aggressive</option>
            </select>
            <div className="muted" style={{ marginTop: 8 }}>
              Logging: Verbose
            </div>

            <div style={{ height: 8 }}></div>
            <label className="muted" style={{ display: "block", marginBottom: 6 }}>
              JIRA Issue Key (per task)
            </label>
            <input
              type="text"
              value={jiraIssueKey}
              onChange={e => setJiraIssueKey(e.target.value)}
              placeholder="e.g. ENG-123"
              style={{
                width: "100%",
                height: 34,
                borderRadius: 8,
                border: "1px solid #1f2937",
                background: "#0f1421",
                color: "#e5e7eb",
                padding: "0 8px",
                marginBottom: 8
              }}
            />

            <div className="muted" style={{ display: "block", marginBottom: 6 }}>
              Auto-refresh PR/JIRA comments
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 8 }}>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={autoRefreshEnabled}
                  onChange={e => setAutoRefreshEnabled(e.target.checked)}
                />
                <span className="muted">Enabled</span>
              </label>
              <div></div>
              <label className="muted" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                Interval (sec)
                <input
                  type="number"
                  min={5}
                  step={5}
                  value={refreshIntervalSec}
                  onChange={e => {
                    const v = parseInt(e.target.value || "0", 10);
                    if (!Number.isFinite(v)) return;
                    setRefreshIntervalSec(Math.max(5, v));
                  }}
                  style={{
                    width: 80,
                    height: 30,
                    borderRadius: 8,
                    border: "1px solid #1f2937",
                    background: "#0f1421",
                    color: "#e5e7eb",
                    padding: "0 8px"
                  }}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </>
  );
}