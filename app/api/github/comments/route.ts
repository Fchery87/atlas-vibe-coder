import { NextResponse } from "next/server";
import { addCommentToPR, getOctokit, getRepoEnv } from "../../../../lib/github";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pull_number, comment_body, body: bodyStr, path, commit_id, line, side } = body || {};
    const text = comment_body || bodyStr;
    if (!pull_number || !text) {
      return NextResponse.json({ error: "Missing pull_number or body" }, { status: 400 });
    }
    const { owner, repo } = getRepoEnv();
    const octokit = getOctokit();
    const data = await addCommentToPR(octokit, owner, repo, Number(pull_number), String(text), path, commit_id, line, side);
    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}