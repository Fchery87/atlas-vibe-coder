import { NextResponse } from "next/server";
import { compareBranches, getOctokit, getRepoEnv } from "../../../../lib/github";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const head = url.searchParams.get("head");
    const { owner, repo, base } = getRepoEnv();
    if (!head) {
      return NextResponse.json({ error: "Missing head query param" }, { status: 400 });
    }
    const octokit = getOctokit();
    const { files, headSha } = await compareBranches(octokit, owner, repo, base, head);
    return NextResponse.json({ base, head, headSha, files });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}