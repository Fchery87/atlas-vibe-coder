"use client";

import { Send } from "lucide-react";
import { LogEntry } from "../lib/types";

type Props = {
  logs: LogEntry[];
  discussionText: string;
  onDiscussionChange: (v: string) => void;
  onSendDiscussion: () => void;
};

export default function AutonomousLog({
  logs,
  discussionText,
  onDiscussionChange,
  onSendDiscussion
}: Props) {
  return (
    <>
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
            onChange={e => onDiscussionChange(e.target.value)}
            placeholder="Add a clarification for Atlas..."
          />
          <button className="btn btn-secondary" onClick={onSendDiscussion}>
            <Send className="icon" />
            Send
          </button>
        </div>
      </div>
    </>
  );
}