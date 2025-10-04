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

export type ToolKey = "activity" | "changed" | "files" | "terminal" | "integrations" | "settings" | null;