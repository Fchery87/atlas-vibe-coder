import { NextResponse } from "next/server";
import { compareBranches, getOctokit, getRepoEnv } from "../../../../lib/github";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const head = url.searchParams.get("head");
    const full = url.searchParams.get("full_name"); // optional override owner/repo (owner/repo)
    const baseOverride = url.searchParams.get("base"); // optional override base branch
    if (!head) {
      return NextResponse.json({ error: "Missing head query param" }, { status: 400 });
    }

    let { owner, repo, base } = getRepoEnv();
    if (full && full.includes("/")) {
      const [o, r] = full.split("/");
      owner = o;
      repo = r;
    }
    if (baseOverride) {
      base = baseOverride;
    }

    const octokit = getOctokit();
    const { files, headSha } = await compareBranches(octokit, owner, repo, base, head);
    return NextResponse.json({ owner, repo, base, head, headSha, files });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}