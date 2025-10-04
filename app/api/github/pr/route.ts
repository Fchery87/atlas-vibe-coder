import { NextResponse } from "next/server";
import { createPullRequest, getOctokit, getRepoEnv } from "../../../../lib/github";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title = "Atlas PR", head, base, description, draft } = body || {};

    if (!head) {
      return NextResponse.json({ error: "Missing head (branch)" }, { status: 400 });
    }

    const { owner, repo, base: envBase } = getRepoEnv();
    const octokit = getOctokit();
    const pr = await createPullRequest(octokit, owner, repo, title, head, base || envBase, description, draft);
    return NextResponse.json({ ...pr, head_sha: pr.head?.sha });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}