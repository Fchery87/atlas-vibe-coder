import { NextResponse } from "next/server";
import { getOctokit, getRepoEnv, getTreeRecursive } from "../../../../lib/github";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const full = url.searchParams.get("full_name"); // optional owner/repo
    const branchOverride = url.searchParams.get("branch");
    let { owner, repo, base } = getRepoEnv();
    if (full && full.includes("/")) {
      const [o, r] = full.split("/");
      owner = o;
      repo = r;
    }
    const branch = branchOverride || base;

    const octokit = getOctokit();
    const tree = await getTreeRecursive(octokit, owner, repo, branch);
    return NextResponse.json({ owner, repo, branch, tree });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}