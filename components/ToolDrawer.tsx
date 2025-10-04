"use client";

import { List, Folder, Terminal as TerminalIcon, Link as LinkIcon, Settings as SettingsIcon } from "lucide-react";
import { ToolKey } from "../lib/types";

type Props = {
  tool: ToolKey;
  setTool: (t: ToolKey) => void;
  branch: string;
  testOutput: string;
};

export default function ToolDrawer({ tool, setTool, branch, testOutput }: Props) {
  return (
    <>
      <nav className="tool-nav" aria-label="Tools">
        <button className={`tool-btn ${tool === "activity" ? "active" : ""}`} title="Activity Log" onClick={() => setTool("activity")}>
          <List />
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
          </div>
        )}
      </div>
    </>
  );
}