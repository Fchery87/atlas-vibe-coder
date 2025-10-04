"use client";

import { useEffect, useState } from "react";
import { GitBranch, GitPullRequest, FileCode2, Mic, Globe, Code as CodeIcon } from "lucide-react";
import AutonomousLog from "../components/AutonomousLog";
import DiffViewer from "../components/DiffViewer";
import ToolDrawer from "../components/ToolDrawer";
import type { Comment, DiffFile, LogEntry, ToolKey } from "../lib/types";

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

const fallbackPatch = `diff --git a/apps/api/src/modules/metrics/metrics.controller.ts b/apps/api/src/modules/metrics/metrics.controller.ts
index 000000..111111 100644
--- a/apps/api/src/modules/metrics/metrics.controller.ts
+++ b/apps/api/src/modules/metrics/metrics.controller.ts
@@ -12,3 +12,3 @@
-function ensureRequestId(headers: Headers) {
-  headers.set("X-Request-ID", "...");
-}
+function ensureRequestId(headers: Headers) {
+  headers.set("X-Request-Id", "...");
+}
@@ -27,1 +27,1 @@
-  hdrs.set("host", url.hostname);
+  hdrs.delete("host");
`;

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
  const [tool, setTool] = useState<ToolKey>("activity");
  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([]);
  const [prNumber, setPrNumber] = useState<number | null>(null);

  // WebSocket log streaming (if NEXT_PUBLIC_WS_URL defined)
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WS_URL;
    if (!url) return;
    try {
      const ws = new WebSocket(url);
      ws.onmessage = ev => {
        const text = typeof ev.data === "string" ? ev.data : "";
        setLogs(prev => [...prev, { kind: "executing", title: "WS", text, ts: nowTs() }]);
      };
      ws.onerror = () => {
        setLogs(prev => [...prev, { kind: "executing", title: "WS Error", text: "WebSocket error", ts: nowTs() }]);
      };
      return () => ws.close();
    } catch {
      // ignore
    }
  }, []);

  // Load diff from GitHub via API route (fallback to sample patch)
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/github/diff?head=${encodeURIComponent(branch)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const files: DiffFile[] = data.files || [];
        if (!files.length) {
          setDiffFiles([{ filename: filePath, status: "modified", additions: 2, deletions: 2, changes: 4, patch: fallbackPatch }]);
        } else {
          setDiffFiles(files);
        }
      } catch {
        setDiffFiles([{ filename: filePath, status: "modified", additions: 2, deletions: 2, changes: 4, patch: fallbackPatch }]);
      }
    }
    load();
  }, [branch, filePath]);

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
        { kind: "researching", title: "Quick", items: ["Reading requested file(s)"], text: instruction || undefined, ts: nowTs() }
      ]);
    }
  }

  function onAddComment(idx: number, text: string) {
    setComments(prev => [...prev, { lineIndex: idx, text }]);
    setLogs(prev => [...prev, { kind: "user", title: "User Review", items: [`Comment on line ${idx + 1}`], text, ts: nowTs() }]);

    // Attempt to sync comment to GitHub if PR number available
    if (prNumber) {
      fetch("/api/github/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pull_number: prNumber, body: text })
      }).catch(() => {});
    }
  }

  async function createPullRequest() {
    try {
      const res = await fetch("/api/github/pr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Atlas: Implement Auth API Fix", head: branch })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPrNumber(data.number || data.pull_number || null);
      setLogs(prev => [...prev, { kind: "executing", title: "PR", text: `Created PR #${data.number}`, ts: nowTs() }]);
    } catch (err) {
      setLogs(prev => [...prev, { kind: "executing", title: "PR Error", text: String(err), ts: nowTs() }]);
    }
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
            <button className="btn btn-pr" onClick={createPullRequest}>
              <GitPullRequest className="icon" />
              Pull Request
            </button>
          </div>
        </header>

        <AutonomousLog
          logs={logs}
          discussionText={discussionText}
          onDiscussionChange={setDiscussionText}
          onSendDiscussion={() => {
            const val = discussionText.trim();
            if (!val) return;
            setLogs(prev => [...prev, { kind: "user", title: "User Clarification", text: val, ts: nowTs() }]);
            setDiscussionText("");
          }}
        />
      </aside>

      {/* Center Panel */}
      <section className="panel-center">
        <div className="code-header">
          <div className="tabs" role="tablist" aria-label="Editor Tabs">
            <button className={`tab ${tab === "diff" ? "active" : ""}`} onClick={() => setTab("diff")} role="tab" aria-selected={tab === "diff"}>
              Diff
            </button>
            <button className={`tab ${tab === "source" ? "active" : ""}`} onClick={() => setTab("source")} role="tab" aria-selected={tab === "source"}>
              Source
            </button>
            <button className={`tab ${tab === "tests" ? "active" : ""}`} onClick={() => setTab("tests")} role="tab" aria-selected={tab === "tests"}>
              Tests
            </button>
          </div>
          <div className="file-path">
            <FileCode2 className="icon" />
            <span>{filePath}</span>
          </div>
        </div>

        <div className="editor-viewport">
          {tab === "diff" && <DiffViewer filePath={filePath} diffFiles={diffFiles} comments={comments} onAddComment={onAddComment} />}

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

      <ToolDrawer tool={tool} setTool={setTool} branch={branch} testOutput={testOutputText} />

      {/* Bottom Input Bar */}
      <div className="bottom-bar">
        <div className="input-area">
          <textarea value={newInstruction} onChange={e => setNewInstruction(e.target.value)} placeholder="Type, paste or import your task here..." />
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