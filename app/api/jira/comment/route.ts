import { NextResponse } from "next/server";

function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function getJiraEnv() {
  const baseUrl = required("JIRA_BASE_URL", process.env.JIRA_BASE_URL);
  const email = required("JIRA_EMAIL", process.env.JIRA_EMAIL);
  const token = required("JIRA_API_TOKEN", process.env.JIRA_API_TOKEN);
  return { baseUrl, email, token };
}

export async function POST(req: Request) {
  try {
    const { baseUrl, email, token } = getJiraEnv();
    const body = await req.json().catch(() => ({}));
    const { issueKey, text } = body || {};

    if (!issueKey || !text) {
      return NextResponse.json({ error: "Missing issueKey or text" }, { status: 400 });
    }

    const auth = Buffer.from(`${email}:${token}`).toString("base64");
    const payload = {
      body: {
        type: "doc",
        version: 1,
        content: [{ type: "paragraph", content: [{ type: "text", text }] }]
      }
    };

    const resp = await fetch(`${baseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json();
    if (!resp.ok) {
      return NextResponse.json({ error: data }, { status: resp.status });
    }
    return NextResponse.json({ ok: true, id: data.id });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}