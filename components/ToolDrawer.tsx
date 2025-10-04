"use client";

import { useEffect, useMemo, useState } from "react";
import { List, Folder, Terminal as TerminalIcon, Link as LinkIcon, Settings as SettingsIcon, FileDiff } from "lucide-react";
import { ToolKey } from "../lib/types";
import type { DiffFile } from "../lib/types";

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
  setRefreshIntervalSec
}: Props) {
  const [tree, setTree] = useState<TreeItem[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (tool !== "files") return;
    (async () => {
      try {
        const res = await fetch(`/api/github/files?branch=${encodeURIComponent(branch)}`);
        const data = await res.json();
        setTree(Array.isArray(data.tree) ? data.tree : []);
      } catch {
        setTree([]);
      }
    })();
  }, [tool, branch]);

  const filtered = useMemo(() => {
    if (!q.trim()) return tree;
    const qq = q.toLowerCase();
    return tree.filter(t => (t.path || "").toLowerCase().includes(qq));
  }, [tree, q]);

  return (
    <>
      <nav className="tool-nav" aria-label="Tools">
        <button className={`tool-btn ${tool === "activity" ? "active" : ""}`} title="Activity Log" onClick={() => setTool("activity")}>
          <List />
        </button>
        <button className={`tool-btn ${tool === "changed" ? "active" : ""}`} title="Changed Files" onClick={() => setTool("changed")}>
          <FileDiff />
          {diffFiles?.length ? <span className="tool-badge">{diffFiles.length}</span> : null}
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
                  padding: "0 8px"
                }}
              />
            </div>
            <div className="tool-section file-list" style={{ maxHeight: "60vh", overflow: "auto" }}>
              {diffFiles
                .slice()
                .sort((a, b) => a.filename.localeCompare(b.filename))
                .filter(f => !q.trim() || f.filename.toLowerCase().includes(q.toLowerCase()))
                .map((f) => (
                  <button
                    key={f.filename}
                    className={`file-row ${selectedPath === f.filename ? "active" : ""}`}
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
          <div className="tool-section">
            <h4>Integrations</h4>
            <div className="muted">JIRA • Slack • GitHub</div>
            <div style={{ marginTop: 8 }}>
              <button className="btn" style={{ marginRight: 8 }}>
                <LinkIcon className="icon" /> Connect GitHub
              </button>
              <button className="btn">
                <LinkIcon className="icon" /> Connect Slack
              </button>
            </div>
          </div>
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