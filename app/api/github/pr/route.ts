import { NextResponse } from "next/server";
import { createPullRequest, getOctokit, getRepoEnv } from "../../../../lib/github";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { title = "Atlas PR", head, base, description, draft, full_name } = body || {};

    if (!head) {
      return NextResponse.json({ error: "Missing head (branch)" }, { status: 400 });
    }

    let { owner, repo, base: envBase } = getRepoEnv();
    if (full_name && typeof full_name === "string" && full_name.includes("/")) {
      const [o, r] = (full_name as string).split("/");
      owner = o;
      repo = r;
    }

    const octokit = getOctokit();
    const pr = await createPullRequest(octokit, owner, repo, title, head, base || envBase, description, draft);
    return NextResponse.json({ ...pr, head_sha: pr.head?.sha });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}