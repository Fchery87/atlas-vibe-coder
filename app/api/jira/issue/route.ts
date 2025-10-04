import { NextResponse } from "next/server";

function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

function getJiraEnv() {
  const baseUrl = required("JIRA_BASE_URL", process.env.JIRA_BASE_URL);
  const email = required("JIRA_EMAIL", process.env.JIRA_EMAIL);
  const token = required("JIRA_API_TOKEN", process.env.JIRA_API_TOKEN);
  const projectKey = required("JIRA_PROJECT_KEY", process.env.JIRA_PROJECT_KEY);
  return { baseUrl, email, token, projectKey };
}

export async function POST(req: Request) {
  try {
    const { baseUrl, email, token, projectKey } = getJiraEnv();
    const body = await req.json().catch(() => ({}));
    const { summary, description, type = "Task" } = body || {};

    if (!summary) {
      return NextResponse.json({ error: "Missing summary" }, { status: 400 });
    }

    const auth = Buffer.from(`${email}:${token}`).toString("base64");
    const payload = {
      fields: {
        project: { key: projectKey },
        summary,
        description,
        issuetype: { name: type }
      }
    };

    const resp = await fetch(`${baseUrl}/rest/api/3/issue`, {
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
    return NextResponse.json({ key: data.key, id: data.id, self: data.self });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}