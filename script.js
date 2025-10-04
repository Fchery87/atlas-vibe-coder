/**
 * Atlas Frontend — Autonomous SWE Agent UI
 * Minimal interactive prototype:
 * - Three-panel layout (Left: Autonomous Log, Center: Code/Diff, Right: Tools)
 * - Bottom input bar with modes: Quick, Think, Run on Atlas
 * - Inline diff viewer with comment capability
 */

const state = {
  mode: "quick",
  tab: "diff",
  branch: "feature/auth-api-fix",
  filePath: "apps/api/src/modules/metrics/metrics.controller.ts",
  comments: [],
  logs: []
};

// Sample source (for Source tab)
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

// Sample diff data
const diffData = [
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
  { type: "added", old: "", new: 24, text: "  if (tok) hdrs.set(\"Authorization\", `Bearer ${tok}`);" },

  { type: "context", old: 26, new: 26, text: "  // Remove host header to avoid mismatch" },
  { type: "removed", old: 27, new: "", text: "  hdrs.set(\"host\", url.hostname);" },
  { type: "added", old: "", new: 27, text: "  hdrs.delete(\"host\");" },

  { type: "context", old: 29, new: 29, text: "  return fetch(target, { method, headers: hdrs, body });" },
  { type: "context", old: 30, new: 30, text: "}" }
];

// Sample tests
const testSummaryText = "Test Suites: 12 passed, 0 failed | Tests: 87 passed, 0 failed | Coverage: 92.3% statements";
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

// Initial logs (Autonomous Log)
const initialLogs = [
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
    items: [
      "Reading README.md",
      "Scanning prometheus/prometheus.yml",
      "Reviewing apps/web/src/lib/api.ts"
    ],
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
    items: [
      "Modifying metrics.controller.ts",
      "Updating /api/proxy.ts usage"
    ],
    ts: nowTs()
  }
];

function nowTs() {
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Render Autonomous Log
function renderLogFeed() {
  const feed = document.getElementById("logFeed");
  feed.innerHTML = "";
  state.logs.forEach(entry => {
    const grp = document.createElement("div");
    grp.className = "log-group";

    const head = document.createElement("div");
    head.className = "log-head";

    const title = document.createElement("div");
    title.className = "log-title";
    const badge = document.createElement("span");
    badge.className = `badge ${entry.kind}`;
    badge.textContent = entry.title;
    const ts = document.createElement("span");
    ts.className = "muted";
    ts.textContent = entry.ts;

    title.appendChild(badge);
    head.appendChild(title);
    head.appendChild(ts);
    grp.appendChild(head);

    if (entry.items && entry.items.length) {
      const ul = document.createElement("ul");
      ul.className = "log-list";
      entry.items.forEach(it => {
        const li = document.createElement("li");
        li.textContent = it;
        ul.appendChild(li);
      });
      grp.appendChild(ul);
    }

    if (entry.output) {
      const out = document.createElement("div");
      out.className = "log-output";
      out.textContent = entry.output;
      grp.appendChild(out);
    }

    if (entry.text) {
      const out = document.createElement("div");
      out.className = "log-output";
      out.textContent = entry.text;
      grp.appendChild(out);
    }

    feed.appendChild(grp);
  });

  // Refresh icons for any dynamic content
  if (window.lucide) window.lucide.createIcons();
}

// Render Diff
function renderDiff() {
  const wrap = document.getElementById("diffView");
  wrap.innerHTML = "";

  const header = document.createElement("div");
  header.className = "diff-header";
  const fileChip = document.createElement("div");
  fileChip.className = "diff-file";
  fileChip.innerHTML = `<i data-lucide="git-commit" class="icon"></i> ${state.filePath}`;
  header.appendChild(fileChip);
  wrap.appendChild(header);

  const linesEl = document.createElement("div");
  linesEl.className = "diff-lines";

  diffData.forEach((ln, idx) => {
    const row = document.createElement("div");
    row.className = `diff-line ${ln.type}`;
    row.dataset.index = String(idx);

    const oldNum = document.createElement("div");
    oldNum.className = "ln";
    oldNum.textContent = ln.old === "" || ln.old === undefined ? "" : String(ln.old);

    const newNum = document.createElement("div");
    newNum.className = "ln";
    newNum.textContent = ln.new === "" || ln.new === undefined ? "" : String(ln.new);

    const sign = document.createElement("div");
    sign.className = "sign";
    sign.textContent = ln.type === "added" ? "+" : ln.type === "removed" ? "-" : " ";

    const code = document.createElement("div");
    code.className = "code";
    code.textContent = ln.text;

    const commentBtn = document.createElement("button");
    commentBtn.className = "comment-btn";
    commentBtn.title = "Comment on this line";
    commentBtn.innerHTML = `<i data-lucide="message-square"></i>`;
    commentBtn.addEventListener("click", ev => {
      ev.stopPropagation();
      showCommentPopover(row, idx);
    });

    row.appendChild(oldNum);
    row.appendChild(newNum);
    row.appendChild(sign);
    row.appendChild(code);
    row.appendChild(commentBtn);

    linesEl.appendChild(row);

    // If there are saved comments for this line, render a condensed thread below
    const thread = state.comments.filter(c => c.lineIndex === idx);
    if (thread.length) {
      const threadEl = document.createElement("div");
      threadEl.style.background = "rgba(124,58,237,0.08)";
      threadEl.style.borderTop = "1px dashed #334155";
      threadEl.style.gridColumn = "1 / -1";
      threadEl.style.padding = "8px 12px";
      threadEl.style.fontFamily = "var(--sans)";
      threadEl.style.color = "#cbd5e1";
      threadEl.innerHTML = `<strong>Comments:</strong><br>${thread.map(t => escapeHtml(t.text)).join("<br>")}`;
      linesEl.appendChild(threadEl);
    }
  });

  wrap.appendChild(linesEl);
  if (window.lucide) window.lucide.createIcons();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Comment popover
function showCommentPopover(anchorEl, idx) {
  closePopover();

  const rect = anchorEl.getBoundingClientRect();
  const pop = document.createElement("div");
  pop.className = "comment-popover";
  pop.innerHTML = `
    <header><i data-lucide="message-square" class="icon"></i> Add review comment</header>
    <textarea id="commentText" placeholder="Write a note for Atlas..."></textarea>
    <div class="comment-actions">
      <button class="btn" id="cancelComment">Cancel</button>
      <button class="btn btn-primary" id="saveComment">Save</button>
    </div>
  `;
  document.body.appendChild(pop);

  const top = rect.top + window.scrollY + 8;
  const left = rect.left + window.scrollX + 420;
  pop.style.top = `${top}px`;
  pop.style.left = `${left}px`;

  if (window.lucide) window.lucide.createIcons();

  document.getElementById("cancelComment").addEventListener("click", () => {
    closePopover();
  });

  document.getElementById("saveComment").addEventListener("click", () => {
    const text = document.getElementById("commentText").value.trim();
    if (!text) return;
    state.comments.push({ lineIndex: idx, text });
    // Feed comment back into the Autonomous Log for Atlas to use
    state.logs.push({
      kind: "user",
      title: "User Review",
      items: [`Comment on line ${idx + 1}`],
      text,
      ts: nowTs()
    });
    renderLogFeed();
    renderDiff();
    closePopover();
  });
}

function closePopover() {
  const existing = document.querySelector(".comment-popover");
  if (existing) existing.remove();
}

// Tabs
function setupTabs() {
  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      tabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.tab = btn.dataset.tab;
      updateViews();
    });
  });
}

function updateViews() {
  const diffView = document.getElementById("diffView");
  const sourceView = document.getElementById("sourceView");
  const testsView = document.getElementById("testsView");
  diffView.classList.add("hidden");
  sourceView.classList.add("hidden");
  testsView.classList.add("hidden");

  if (state.tab === "diff") {
    diffView.classList.remove("hidden");
  } else if (state.tab === "source") {
    sourceView.classList.remove("hidden");
  } else {
    testsView.classList.remove("hidden");
  }
}

// Bottom bar modes
function setupModes() {
  document.querySelectorAll(".mode-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const mode = btn.dataset.mode;
      state.mode = mode;
      handleModeAction(mode);
    });
  });
}

function handleModeAction(mode) {
  const input = document.getElementById("mainInput").value.trim();
  if (mode === "think") {
    // Verbose planning before acting
    state.logs.push({
      kind: "planning",
      title: "Planning",
      items: [
        "Break down task into substeps",
        "Search and read relevant files",
        "Draft patch and outline tests",
        "Run validation steps"
      ],
      text: input ? `User instruction: ${input}` : undefined,
      ts: nowTs()
    });
    renderLogFeed();
  } else if (mode === "run") {
    // Simulated autonomous execution flow
    state.logs.push({
      kind: "executing",
      title: "Executing",
      items: ["npm run lint", "npm run test -- --coverage"],
      ts: nowTs()
    });
    renderLogFeed();

    setTimeout(() => {
      state.logs.push({
        kind: "drafting",
        title: "Drafting Code",
        items: ["Applying diff to metrics.controller.ts"],
        ts: nowTs()
      });
      renderLogFeed();
    }, 600);

    setTimeout(() => {
      state.logs.push({
        kind: "executing",
        title: "Executing",
        items: ["jest --coverage"],
        output: testSummaryText,
        ts: nowTs()
      });
      renderLogFeed();
      showTests();
    }, 1200);
  } else {
    // Quick: non-autonomous lightweight actions
    state.logs.push({
      kind: "researching",
      title: "Quick",
      items: ["Reading requested file(s)"],
      text: input ? `Quick read: ${input}` : undefined,
      ts: nowTs()
    });
    renderLogFeed();
  }
}

function showTests() {
  state.tab = "tests";
  document.querySelectorAll(".tab").forEach(b => {
    b.classList.remove("active");
    if (b.dataset.tab === "tests") b.classList.add("active");
  });
  updateViews();
}

// Discussion input
function setupDiscussion() {
  const inp = document.getElementById("discussionInput");
  const send = document.getElementById("discussionSend");
  send.addEventListener("click", () => {
    const val = inp.value.trim();
    if (!val) return;
    state.logs.push({
      kind: "user",
      title: "User Clarification",
      items: [],
      text: val,
      ts: nowTs()
    });
    inp.value = "";
    renderLogFeed();
  });
}

// Tool drawer
function setupToolDrawer() {
  const drawer = document.getElementById("toolDrawer");
  const buttons = document.querySelectorAll(".tool-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tool = btn.dataset.tool;
      if (tool === "activity") {
        drawer.innerHTML = `
          <div class="tool-section">
            <h4>Global Activity</h4>
            <div class="muted">Recent tasks handled by Atlas will appear here.</div>
          </div>
          <div class="tool-section">
            <h4>Current Branch</h4>
            <div>${state.branch}</div>
          </div>
        `;
        drawer.classList.remove("hidden");
      } else if (tool === "files") {
        drawer.innerHTML = `
          <div class="tool-section">
            <h4>File Explorer</h4>
            <input type="text" placeholder="Search repository..." style="width:100%;height:30px;border-radius:8px;border:1px solid #1f2937;background:#0f1421;color:#e5e7eb;padding:0 8px;" />
          </div>
          <div class="tool-section file-list">
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
        `;
        drawer.classList.remove("hidden");
      } else if (tool === "terminal") {
        drawer.innerHTML = `
          <div class="tool-section">
            <h4>Live Terminal</h4>
            <pre class="test-output">> jest --coverage
${testOutputText}</pre>
          </div>
        `;
        drawer.classList.remove("hidden");
      } else if (tool === "integrations") {
        drawer.innerHTML = `
          <div class="tool-section">
            <h4>Integrations</h4>
            <div class="muted">JIRA • Slack • GitHub</div>
            <div style="margin-top:8px;">
              <button class="btn"><i data-lucide="link" class="icon"></i> Connect GitHub</button>
              <button class="btn" style="margin-left:8px;"><i data-lucide="link" class="icon"></i> Connect Slack</button>
            </div>
          </div>
        `;
        drawer.classList.remove("hidden");
      } else if (tool === "settings") {
        drawer.innerHTML = `
          <div class="tool-section">
            <h4>Agent Settings</h4>
            <label class="muted" style="display:block;margin-bottom:6px;">Autonomy Level</label>
            <select style="width:100%;height:34px;border-radius:8px;border:1px solid #1f2937;background:#0f1421;color:#e5e7eb;padding:0 8px;">
              <option>Conservative</option>
              <option selected>Balanced</option>
              <option>Aggressive</option>
            </select>
            <div class="muted" style="margin-top:8px;">Logging: Verbose</div>
          </div>
        `;
        drawer.classList.remove("hidden");
      }
      if (window.lucide) window.lucide.createIcons();
    });
  });
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("branchName").textContent = state.branch;
  document.getElementById("filePath").textContent = state.filePath;
  document.getElementById("sourceCode").textContent = sampleSource;
  document.getElementById("testSummary").textContent = testSummaryText;
  document.getElementById("testOutput").textContent = testOutputText;

  // Seed logs
  state.logs = initialLogs.slice();
  renderLogFeed();

  renderDiff();
  setupTabs();
  setupModes();
  setupDiscussion();
  setupToolDrawer();
  updateViews();
});

// Close popover when clicking outside
document.addEventListener("click", (e) => {
  const pop = document.querySelector(".comment-popover");
  if (!pop) return;
  if (!pop.contains(e.target)) {
    closePopover();
  }
});