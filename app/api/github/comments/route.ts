import { NextResponse } from "next/server";
import { addCommentToPR, getOctokit, getRepoEnv } from "../../../../lib/github";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const pull_number = url.searchParams.get("pull_number");
    if (!pull_number) {
      return NextResponse.json({ error: "Missing pull_number" }, { status: 400 });
    }
    const { owner, repo } = getRepoEnv();
    const octokit = getOctokit();

    const [reviewComments, issueComments, pr] = await Promise.all([
      octokit.pulls.listReviewComments({ owner, repo, pull_number: Number(pull_number), per_page: 100 }),
      octokit.issues.listComments({ owner, repo, issue_number: Number(pull_number), per_page: 100 }),
      octokit.pulls.get({ owner, repo, pull_number: Number(pull_number) })
    ]);

    return NextResponse.json({
      head_sha: pr.data.head.sha,
      review_comments: reviewComments.data,
      issue_comments: issueComments.data
    });
  } catch (err: any) {
    return NextResponse.json({ error: String(err?.message || err) }, { status: 500 });
  }
}

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