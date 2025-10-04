import { NextResponse } from "next/server";
import { getOctokit, getRepoEnv, getTreeRecursive } from "../../../../lib/github";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const branch = url.searchParams.get("branch") || getRepoEnv().base;
    const { owner, repo } = getRepoEnv();
    const octokit = getOctokit();

    const tree = await getTreeRecursive(octokit, owner, repo, branch);
    return NextResponse.json({ branch, tree });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}