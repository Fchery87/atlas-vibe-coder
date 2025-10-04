"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GitBranch,
  GitPullRequest,
  FileCode2,
  GitCommit,
  MessageSquare,
  List,
  Folder,
  Terminal as TerminalIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
  Mic,
  Globe,
  Code as CodeIcon,
  Send
} from "lucide-react";

type LogEntry = {
  kind: "planning" | "researching" | "executing" | "drafting" | "user";
  title: string;
  items?: string[];
  text?: string;
  output?: string;
  ts: string;
};

type DiffLine = {
  type: "context" | "added" | "removed" | "modified";
  old: string | number | "";
  new: string | number | "";
  text: string;
};

type Comment = {
  lineIndex: number;
  text: string;
};

function nowTs() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const sampleSource = `function ensureRequestId(headers: Headers) {
  headers.set("X-Request-Id", \`req_\${Date.now()}_\${Math.random().toString(36).slice(2)}\`);
}

async function forward(req: NextRequest, method: string, body?: BodyInit | null) {
  const url = new URL(req.url);
  const target = new URL(makeTargetUrl(url.pathname));
  target.search = url.search;

  const hdrs = new Headers(req.headers);
  // Attach JWT from cookie
  const tok = cookies().get("token")?.value;
  if (tok) hdrs.set("Authorization", \`Bearer \${tok}\`);

  // Remove host header to avoid mismatch
  hdrs.delete("host");

  return fetch(target, { method, headers: hdrs, body });
}`;

const diffData: DiffLine[] = [
  { type: "context", old: 12, new: 12, text: "function ensureRequestId(headers: Headers) {" },
  { type: "removed", old: 13, new: "", text: "  headers.set(\"X-Request-ID\", `req_${Date.now()}_${Math.random().toString(36).slice(2)}`);" },
  { type: "added", old: "", new: 13, text: "  headers.set(\"X-Request-Id\", `req_${Date.now()}_${Math.random().toString(36).slice(2)}`);" },
  { type: "context", old: 14, new: 14, text: "}" },

  { type: "context", old: 16, new: 16, text: "async function forward(req: NextRequest, method: string, body?: BodyInit | null) {" },
  { type: "context", old: 17, new: 17, text: "  const url = new URL(req.url);" },
  { type: "context", old: 18, new: 18, text: "  const target = new URL(makeTargetUrl(url.pathname));" },
  { type: "context", old: 19, new: 19, text: "  target.search = url.search;" },

  { type: "context", old: 21, new: 21, text: "  const hdrs = new Headers(req.headers);" },
  { type: "added", old: "", new: 22, text: "  // Attach JWT from cookie" },
  { type: "added", old: "", new: 23, text: "  const tok = cookies().get(\"token\")?.value;" },
  { type: "added", old: "", new: 24, text: "  if (tok) hdrs.set(\"Authorization\", `Bearer ${"tok"}`);" },

  { type: "context", old: 26, new: 26, text: "  // Remove host header to avoid mismatch" },
  { type: "removed", old: 27, new: "", text: "  hdrs.set(\"host\", url.hostname);" },
  { type: "added", old: "", new: 27, text: "  hdrs.delete(\"host\");" },

  { type: "context", old: 29, new: 29, text: "  return fetch(target, { method, headers: hdrs, body });" },
  { type: "context", old: 30, new: 30, text: "}" }
];

const testSummaryText =
  "Test Suites: 12 passed, 0 failed | Tests: 87 passed, 0 failed | Coverage: 92.3% statements";

const testOutputText = `
 PASS  apps/api/tests/metrics.controller.spec.ts
  MetricsController
    ✓ ensures request id is set (7 ms)
    ✓ forwards with jwt from cookie (4 ms)
    ✓ removes mismatched host header (3 ms)

 PASS  apps/web/tests/proxy.spec.ts
  proxy
    ✓ passes through auth header (3 ms)

Ran all test suites.
`;

const initialLogs: LogEntry[] = [
  {
    kind: "planning",
    title: "Planning",
    items: [
      "1) Identify root cause in metrics.controller.ts",
      "2) Implement header fix for Request ID typo",
      "3) Ensure JWT is attached from cookie for proxy",
      "4) Remove mismatched host header",
      "5) Run unit tests and update docs"
    ],
    ts: nowTs()
  },
  {
    kind: "researching",
    title: "Researching",
    items: ["Reading README.md", "Scanning prometheus/prometheus.yml", "Reviewing apps/web/src/lib/api.ts"],
    ts: nowTs()
  },
  {
    kind: "executing",
    title: "Executing",
    items: ["npm install", "jest --coverage"],
    output: testSummaryText,
    ts: nowTs()
  },
  {
    kind: "drafting",
    title: "Drafting Code",
    items: ["Modifying metrics.controller.ts", "Updating /api/proxy.ts usage"],
    ts: nowTs()
  }
];

export default function Page() {
  const [branch] = useState("feature/auth-api-fix");
  const [filePath] = useState("apps/api/src/modules/metrics/metrics.controller.ts");
  const [mode, setMode] = useState<"quick" | "think" | "run">("quick");
  const [tab, setTab] = useState<"diff" | "source" | "tests">("diff");
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newInstruction, setNewInstruction] = useState("");
  const [discussionText, setDiscussionText] = useState("");
  const [tool, setTool] = useState<"activity" | "files" | "terminal" | "integrations" | "settings" | null>("activity");
  const [openCommentLine, setOpenCommentLine] = useState<number | null>(null);
  const commentTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (openCommentLine !== null) {
      commentTextareaRef.current?.focus();
    }
  }, [openCommentLine]);

  function handleModeAction(nextMode: "quick" | "think" | "run") {
    setMode(nextMode);

    const instruction = newInstruction.trim();
    if (nextMode === "think") {
      setLogs(prev => [
        ...prev,
        {
          kind: "planning",
          title: "Planning",
          items: ["Break down task", "Search and read files", "Draft patch and outline tests", "Run validation"],
          text: instruction ? `User instruction: ${instruction}` : undefined,
          ts: nowTs()
        }
      ]);
    } else if (nextMode === "run") {
      setLogs(prev => [
        ...prev,
        { kind: "executing", title: "Executing", items: ["npm run lint", "npm run test -- --coverage"], ts: nowTs() }
      ]);
      setTimeout(() => {
        setLogs(prev => [...prev, { kind: "drafting", title: "Drafting Code", items: ["Applying diff"], ts: nowTs() }]);
      }, 600);
      setTimeout(() => {
        setLogs(prev => [
          ...prev,
          { kind: "executing", title: "Executing", items: ["jest --coverage"], output: testSummaryText, ts: nowTs() }
        ]);
        setTab("tests");
      }, 1200);
    } else {
      setLogs(prev => [
        ...prev,
        {
          kind: "researching",
          title: "Quick",
          items: ["Reading requested file(s)"],
          text: instruction ? `Quick read: ${instruction}` : undefined,
          ts: nowTs()
        }
      ]);
    }
  }

  function saveComment(text: string) {
    if (openCommentLine === null || !text.trim()) return;
    const next: Comment = { lineIndex: openCommentLine, text: text.trim() };
    setComments(prev => [...prev, next]);
    setLogs(prev => [
      ...prev,
      {
        kind: "user",
        title: "User Review",
        items: [`Comment on line ${openCommentLine + 1}`],
        text: text.trim(),
        ts: nowTs()
      }
    ]);
    setOpenCommentLine(null);
  }

  return (
    <div className="app-shell">
      {/* Left Panel */}
      <aside className="panel-left">
        <header className="left-header">
          <div className="task-title">
            <span className="chip">Task</span>
            <span>Implement Auth API Fix</span>
          </div>
          <div className="branch-pr">
            <div className="branch">
              <GitBranch className="icon" />
              <span>{branch}</span>
            </div>
            <button className="btn btn-pr">
              <GitPullRequest className="icon" />
              Pull Request
            </button>
          </div>
        </header>

        <div className="autonomous-log" aria-label="Autonomous Log">
          {logs.map((entry, i) => (
            <div className="log-group" key={`log-${i}`}>
              <div className="log-head">
                <div className="log-title">
                  <span className={`badge ${entry.kind}`}>{entry.title}</span>
                </div>
                <span className="muted">{entry.ts}</span>
              </div>
              {entry.items && entry.items.length > 0 && (
                <ul className="log-list">
                  {entry.items.map((it, j) => (
                    <li key={`item-${i}-${j}`}>{it}</li>
                  ))}
                </ul>
              )}
              {entry.output && <div className="log-output">{entry.output}</div>}
              {entry.text && <div className="log-output">{entry.text}</div>}
            </div>
          ))}
        </div>

        <div className="discussion">
          <div className="discussion-header">User Discussion / Clarifications</div>
          <div className="discussion-input">
            <input
              value={discussionText}
              onChange={e => setDiscussionText(e.target.value)}
              placeholder="Add a clarification for Atlas..."
            />
            <button
              className="btn btn-secondary"
              onClick={() => {
                const val = discussionText.trim();
                if (!val) return;
                setLogs(prev => [
                  ...prev,
                  { kind: "user", title: "User Clarification", text: val, ts: nowTs() }
                ]);
                setDiscussionText("");
              }}
            >
              <Send className="icon" />
              Send
            </button>
          </div>
        </div>
      </aside>

      {/* Center Panel */}
      <section className="panel-center">
        <div className="code-header">
          <div className="tabs" role="tablist" aria-label="Editor Tabs">
            <button
              className={`tab ${tab === "diff" ? "active" : ""}`}
              onClick={() => setTab("diff")}
              role="tab"
              aria-selected={tab === "diff"}
            >
              Diff
            </button>
            <button
              className={`tab ${tab === "source" ? "active" : ""}`}
              onClick={() => setTab("source")}
              role="tab"
              aria-selected={tab === "source"}
            >
              Source
            </button>
            <button
              className={`tab ${tab === "tests" ? "active" : ""}`}
              onClick={() => setTab("tests")}
              role="tab"
              aria-selected={tab === "tests"}
            >
              Tests
            </button>
          </div>
          <div className="file-path">
            <FileCode2 className="icon" />
            <span>{filePath}</span>
          </div>
        </div>

        <div className="editor-viewport">
          {tab === "diff" && (
            <div className="view view-diff" aria-live="polite">
              <div className="diff-header">
                <div className="diff-file">
                  <GitCommit className="icon" /> {filePath}
                </div>
              </div>
              <div className="diff-lines">
                {diffData.map((ln, idx) => {
                  const thread = comments.filter(c => c.lineIndex === idx);
                  return (
                    <div key={`diff-${idx}`}>
                      <div className={`diff-line ${ln.type}`} data-index={idx}>
                        <div className="ln">{ln.old === "" ? "" : String(ln.old)}</div>
                        <div className="ln">{ln.new === "" ? "" : String(ln.new)}</div>
                        <div className="sign">
                          {ln.type === "added" ? "+" : ln.type === "removed" ? "-" : " "}
                        </div>
                        <div className="code">{ln.text}</div>
                        <button className="comment-btn" onClick={() => setOpenCommentLine(idx)} title="Comment">
                          <MessageSquare />
                        </button>
                      </div>

                      {openCommentLine === idx && (
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
                            ref={commentTextareaRef}
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
                            <button className="btn" onClick={() => setOpenCommentLine(null)}>Cancel</button>
                            <button
                              className="btn btn-primary"
                              onClick={() => saveComment(commentTextareaRef.current?.value || "")}
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
          )}

          {tab === "source" && (
            <pre className="view view-source">
              <code className="code-block">{sampleSource}</code>
            </pre>
          )}

          {tab === "tests" && (
            <div className="view view-tests">
              <div className="test-summary">{testSummaryText}</div>
              <pre className="test-output">{testOutputText}</pre>
            </div>
          )}
        </div>
      </section>

      {/* Right Tool Nav */}
      <nav className="tool-nav" aria-label="Tools">
        <button
          className={`tool-btn ${tool === "activity" ? "active" : ""}`}
          title="Activity Log"
          onClick={() => setTool("activity")}
        >
          <List />
        </button>
        <button
          className={`tool-btn ${tool === "files" ? "active" : ""}`}
          title="File Explorer"
          onClick={() => setTool("files")}
        >
          <Folder />
        </button>
        <button
          className={`tool-btn ${tool === "terminal" ? "active" : ""}`}
          title="Debugger / Terminal"
          onClick={() => setTool("terminal")}
        >
          <TerminalIcon />
        </button>
        <button
          className={`tool-btn ${tool === "integrations" ? "active" : ""}`}
          title="Integrations"
          onClick={() => setTool("integrations")}
        >
          <LinkIcon />
        </button>
        <button
          className={`tool-btn ${tool === "settings" ? "active" : ""}`}
          title="Settings"
          onClick={() => setTool("settings")}
        >
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
        {tool === "files" && (
          <>
            <div className="tool-section">
              <h4>File Explorer</h4>
              <input
                type="text"
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
            <div className="tool-section file-list">
              apps/
  api/
    src/
      modules/
        metrics/
          metrics.controller.ts
  web/
    src/
      lib/
        api.ts
prometheus/
  prometheus.yml
README.md
            </div>
          </>
        )}
        {tool === "terminal" && (
          <div className="tool-section">
            <h4>Live Terminal</h4>
            <pre className="test-output">{`> jest --coverage\n${testOutputText}`}</pre>
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
          </div>
        )}
      </div>

      {/* Bottom Input Bar */}
      <div className="bottom-bar">
        <div className="input-area">
          <textarea
            value={newInstruction}
            onChange={e => setNewInstruction(e.target.value)}
            placeholder="Type, paste or import your task here..."
          />
        </div>
        <div className="controls">
          <button className={`mode-btn ${mode === "quick" ? "primary" : ""}`} onClick={() => handleModeAction("quick")}>
            Quick
          </button>
          <button className={`mode-btn ${mode === "think" ? "primary" : ""}`} onClick={() => handleModeAction("think")}>
            Think
          </button>
          <button className="mode-btn primary" onClick={() => handleModeAction("run")}>
            Run on Atlas
          </button>
          <div className="divider"></div>
          <button className="icon-btn" title="Mic">
            <Mic />
          </button>
          <button className="icon-btn" title="Web">
            <Globe />
          </button>
          <button className="icon-btn" title="Command">
            <CodeIcon />
          </button>
        </div>
      </div>
    </div>
  );
}