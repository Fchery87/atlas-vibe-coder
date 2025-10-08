import { Octokit } from "@octokit/rest";
import { cookies } from "next/headers";

function required(name: string, value: string | undefined) {
  if (!value) throw new Error(`Missing env: ${name}`);
  return value;
}

/**
 * Server-side Octokit using a bot/token from env.
 * Useful for app-level operations.
 */
export function getOctokit() {
  const token = required("GITHUB_TOKEN", process.env.GITHUB_TOKEN);
  return new Octokit({ auth: token });
}

/**
 * Per-user Octokit using OAuth token stored in cookie (gh_access_token).
 * Falls back to env token if user token absent.
 */
export function getUserOctokit() {
  const userToken = cookies().get("gh_access_token")?.value;
  const auth = userToken || process.env.GITHUB_TOKEN;
  if (!auth) throw new Error("Missing GitHub auth (no user token, no env token).");
  return new Octokit({ auth });
}

export function getRepoEnv() {
  const owner = required("GITHUB_OWNER", process.env.GITHUB_OWNER);
  const repo = required("GITHUB_REPO", process.env.GITHUB_REPO);
  const base = process.env.GITHUB_BASE_BRANCH || "main";
  return { owner, repo, base };
}

export async function getTreeRecursive(octokit: Octokit, owner: string, repo: string, branch: string) {
  const { data: branchData } = await octokit.repos.getBranch({ owner, repo, branch });
  const sha = branchData.commit.sha;
  const { data: tree } = await octokit.git.getTree({ owner, repo, tree_sha: sha, recursive: "1" });
  return tree.tree?.map(t => ({ path: t.path, type: t.type, sha: t.sha })) || [];
}

export async function compareBranches(octokit: Octokit, owner: string, repo: string, base: string, head: string) {
  const { data } = await octokit.repos.compareCommitsWithBasehead({
    owner,
    repo,
    basehead: `${base}...${head}`
  });
  const files = data.files?.map(f => ({
    filename: f.filename,
    status: f.status,
    additions: f.additions,
    deletions: f.deletions,
    changes: f.changes,
    patch: f.patch ?? null
  })) || [];
  const headSha = data.commits?.length ? data.commits[data.commits.length - 1]?.sha : undefined;
  return { files, headSha };
}

export async function createPullRequest(
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string,
  body?: string,
  draft?: boolean
) {
  const { data } = await octokit.pulls.create({
    owner,
    repo,
    title,
    head,
    base,
    body,
    draft
  });
  return data;
}

export async function addCommentToPR(
  octokit: Octokit,
  owner: string,
  repo: string,
  pull_number: number,
  body: string,
  path?: string,
  commit_id?: string,
  line?: number,
  side?: "LEFT" | "RIGHT"
) {
  if (path && commit_id && typeof line === "number") {
    const { data } = await octokit.pulls.createReviewComment({
      owner,
      repo,
      pull_number,
      body,
      commit_id,
      path,
      line,
      side
    });
    return data;
  }
  const { data } = await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body
  });
  return data;
}