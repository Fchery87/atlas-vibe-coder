export type LogEntry = {
  kind: "planning" | "researching" | "executing" | "drafting" | "user";
  title: string;
  items?: string[];
  text?: string;
  output?: string;
  ts: string;
};

export type Comment = {
  lineIndex: number;
  text: string;
};

export type DiffFile = {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string | null;
};

export type PrIssueComment = {
  id: number;
  author?: string;
  body: string;
  createdAt?: string;
  url?: string;
};

export type ReviewComment = {
  id: number;
  author?: string;
  body: string;
  createdAt?: string;
  url?: string;
  path: string;
  line: number;
  side?: "LEFT" | "RIGHT";
};

export type ToolKey = "activity" | "comments" | "changed" | "files" | "terminal" | "integrations" | "settings" | null;