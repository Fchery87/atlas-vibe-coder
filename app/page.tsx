"use client";

import { useEffect, useMemo, useState } from "react";
import { GitBranch, GitPullRequest, FileCode2, Mic, Globe, Code as CodeIcon } from "lucide-react";
import AutonomousLog from "../components/AutonomousLog";
import DiffViewer from "../components/DiffViewer";
import ToolDrawer from "../components/ToolDrawer";
import CenterSidebar from "../components/CenterSidebar";
import type { Comment, DiffFile, LogEntry, ToolKey, PrIssueComment } from "../lib/types";
import { parseUnifiedPatch, mapLineToIndex } from "../lib/diff";

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

function lsKey(pr: number | null, path: string) {
  return `atlas_comments_pr_${pr ?? "none"}_path_${path}`;
}

export default function Page() {
  const [branch] = useState("feature/auth-api-fix");
  const [selectedPath, setSelectedPath] = useState<string>("apps/api/src/modules/metrics/metrics.controller.ts");

  const [mode, setMode] = useState<"quick" | "think" | "run">("quick");
  const [tab, setTab] = useState<"diff" | "source" | "tests">("diff");
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newInstruction, setNewInstruction] = useState("");
  const [discussionText, setDiscussionText] = useState("");
  const [tool, setTool] = useState<ToolKey>("activity");
  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([]);
  const [prNumber, setPrNumber] = useState<number | null>(null);
  const [headSha, setHeadSha] = useState<string | null>(null);
  const [prIssueComments, setPrIssueComments] = useState<PrIssueComment[]>([]);
  const [jiraIssueKey, setJiraIssueKey] = useState<string>("");
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState<boolean>(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(30);

  // Derived: lines for selected file
  const selectedPatch = useMemo(() => {
    const f = diffFiles.find(df => df.filename === selectedPath);
    return f?.patch || fallbackPatch;
  }, [diffFiles, selectedPath]);
  const lines = useMemo(() => parseUnifiedPatch(selectedPatch), [selectedPatch]);

  // WebSocket logs
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
    }
  }, []);

  // Init JIRA key and refresh settings from localStorage or env
  useEffect(() => {
    const savedKey = typeof window !== "undefined" ? localStorage.getItem("atlas_jira_issue_key") : null;
    const envDefault = process.env.NEXT_PUBLIC_DEFAULT_JIRA_ISSUE_KEY || "";
    setJiraIssueKey(savedKey || envDefault || "");

    const savedAuto = typeof window !== "undefined" ? localStorage.getItem("atlas_auto_refresh_enabled") : null;
    if (savedAuto !== null) {
      setAutoRefreshEnabled(savedAuto === "1" || savedAuto === "true");
    }
    const savedInt = typeof window !== "undefined" ? localStorage.getItem("atlas_refresh_interval_sec") : null;
    if (savedInt) {
      const v = parseInt(savedInt, 10);
      if (Number.isFinite(v) && v >= 5) setRefreshIntervalSec(v);
    }
  }, []);

  // Persist JIRA key and refresh settings
  useEffect(() => {
    try {
      localStorage.setItem("atlas_jira_issue_key", jiraIssueKey);
    } catch {}
  }, [jiraIssueKey]);

  useEffect(() => {
    try {
      localStorage.setItem("atlas_auto_refresh_enabled", autoRefreshEnabled ? "1" : "0");
    } catch {}
  }, [autoRefreshEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem("atlas_refresh_interval_sec", String(refreshIntervalSec));
    } catch {}
  }, [refreshIntervalSec]);

  // Load diff from GitHub
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/github/diff?head=${encodeURIComponent(branch)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const files: DiffFile[] = data.files || [];
        setHeadSha(data.headSha || null);
        if (!files.length) {
          setDiffFiles([{ filename: selectedPath, status: "modified", additions: 2, deletions: 2, changes: 4, patch: fallbackPatch }]);
        } else {
          setDiffFiles(files);
          if (!files.find(f => f.filename === selectedPath)) {
            setSelectedPath(files[0].filename);
          }
        }
      } catch {
        setDiffFiles([{ filename: selectedPath, status: "modified", additions: 2, deletions: 2, changes: 4, patch: fallbackPatch }]);
      }
    }
    load();
  }, [branch]);

  // Load local comments when PR/path changes
  useEffect(() => {
    try {
      const raw = localStorage.getItem(lsKey(prNumber, selectedPath));
      if (raw) {
        const arr: Comment[] = JSON.parse(raw);
        setComments(arr);
      } else {
        setComments([]);
      }
    } catch {
      setComments([]);
    }
  }, [prNumber, selectedPath]);

  // Unified refresh function for PR (GitHub) + JIRA comments
  const refreshRemote = async () => {
    if (!prNumber) return;
    try {
      const res = await fetch(`/api/github/comments?pull_number=${prNumber}`);
      if (res.ok) {
        const data = await res.json();
        setHeadSha(data.head_sha || headSha);

        const reviewComments = Array.isArray(data.review_comments) ? data.review_comments : [];
        // Map anchored review comments to local indices
        const mapped: Comment[] = [];
        for (const rc of reviewComments) {
          const path = rc.path as string | undefined;
          const side = (rc.side as "LEFT" | "RIGHT") || "RIGHT";
          const line = (rc.line as number | undefined) || undefined;
          const body = (rc.body as string) || "";
          if (path === selectedPath && typeof line === "number") {
            const idx = mapLineToIndex(lines, side, line);
            if (idx !== null) {
              mapped.push({ lineIndex: idx, text: body });
            }
          }
        }
        // Merge with existing (local)
        setComments(prev => {
          const merged = [...prev, ...mapped];
          const seen = new Set<string>();
          return merged.filter(c => {
            const k = `${c.lineIndex}|${c.text}`;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
        });

        // PR issue comments (non-anchored) for sidebar
        const ics = Array.isArray(data.issue_comments) ? data.issue_comments : [];
        const simplified: PrIssueComment[] = ics.map((c: any) => ({
          id: c.id,
          author: c.user?.login || c.user?.name,
          body: c.body || "",
          createdAt: c.created_at || c.updated_at,
          url: c.html_url || c.url
        }));
        setPrIssueComments(simplified);
      }
    } catch {
      // ignore
    }

    // JIRA comments into log (optional)
    const issueKey = jiraIssueKey;
    if (issueKey) {
      try {
        const jr = await fetch(`/api/jira/comment?issueKey=${encodeURIComponent(issueKey)}`);
        if (jr.ok) {
          const jd = await jr.json();
          const comments = Array.isArray(jd.comments) ? jd.comments : [];
          for (const c of comments) {
            if (c.body_text) {
              setLogs(prev => [...prev, { kind: "user", title: "JIRA", text: c.body_text, ts: nowTs() }]);
            }
          }
        }
      } catch {
        // ignore
      }
    }
  };

  // Initial sync + refresh when dependencies change
  useEffect(() => {
    refreshRemote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prNumber, selectedPath, lines.length, jiraIssueKey]);

  // Auto-poll while PR is present (configurable)
  useEffect(() => {
    if (!prNumber || !autoRefreshEnabled) return;
    const ms = Math.max(5, refreshIntervalSec) * 1000;
    const id = setInterval(() => {
      refreshRemote();
    }, ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prNumber, selectedPath, jiraIssueKey, autoRefreshEnabled, refreshIntervalSec]);

  // Persist comments to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(lsKey(prNumber, selectedPath), JSON.stringify(comments));
    } catch {
      // ignore
    }
  }, [comments, prNumber, selectedPath]);

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

  async function onAddComment(payload: { index: number; text: string; line: number; side: "LEFT" | "RIGHT"; path: string }) {
    const { index, text } = payload;
    setComments(prev => [...prev, { lineIndex: index, text }]);
    setLogs(prev => [...prev, { kind: "user", title: "User Review", items: [`Comment on line ${index + 1}`], text, ts: nowTs() }]);

    // Persist local immediately
    try {
      localStorage.setItem(lsKey(prNumber, selectedPath), JSON.stringify([...comments, { lineIndex: index, text }]));
    } catch {}

    // Sync with GitHub PR
    if (prNumber && headSha) {
      try {
        await fetch("/api/github/comments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pull_number: prNumber,
            comment_body: text,
            path: payload.path,
            commit_id: headSha,
            line: payload.line,
            side: payload.side
          })
        });
      } catch {}
    }

    // Sync with JIRA (optional)
    if (jiraIssueKey) {
      try {
        await fetch("/api/jira/comment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ issueKey: jiraIssueKey, text })
        });
        setLogs(prev => [...prev, { kind: "executing", title: "JIRA", text: `Posted comment to ${jiraIssueKey}`, ts: nowTs() }]);
      } catch {}
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
      const prNum = data.number || data.pull_number || null;
      setPrNumber(prNum);
      setHeadSha(data.head_sha || data.head?.sha || headSha);
      setLogs(prev => [...prev, { kind: "executing", title: "PR", text: `Created PR #${data.number}`, ts: nowTs() }]);
    } catch (err) {
      setLogs(prev => [...prev, { kind: "executing", title: "PR Error", text: String(err), ts: nowTs() }]);
    }
  }

  return (
    <div className="app-shell">
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
            <span>{selectedPath}</span>
          </div>
        </div>

        <div className="center-body">
          <CenterSidebar
            files={diffFiles}
            selectedPath={selectedPath}
            onSelectPath={setSelectedPath}
            issueComments={prIssueComments}
            onRefresh={() => { refreshRemote(); }}
          />
          <div className="center-content">
            <div className="editor-viewport">
              {tab === "diff" && (
                <DiffViewer
                  selectedPath={selectedPath}
                  diffFiles={diffFiles}
                  comments={comments}
                  onAddComment={onAddComment}
                  onSelectPath={setSelectedPath}
                />
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
          </div>
        </div>
      </section>

      <ToolDrawer
        tool={tool}
        setTool={setTool}
        branch={branch}
        testOutput={testOutputText}
        onSelectPath={setSelectedPath}
        jiraIssueKey={jiraIssueKey}
        setJiraIssueKey={setJiraIssueKey}
        autoRefreshEnabled={autoRefreshEnabled}
        setAutoRefreshEnabled={setAutoRefreshEnabled}
        refreshIntervalSec={refreshIntervalSec}
        setRefreshIntervalSec={setRefreshIntervalSec}
      />

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