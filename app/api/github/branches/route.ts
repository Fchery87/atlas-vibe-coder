import { Octokit } from "@octokit/rest";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const token = cookies().get("gh_access_token")?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: "not_authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const url = new URL(req.url);
  const full = url.searchParams.get("full_name"); // owner/repo
  if (!full || !full.includes("/")) {
    return new Response(JSON.stringify({ error: "missing_full_name" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
  const [owner, repo] = full.split("/");
  const octokit = new Octokit({ auth: token });

  const branches: string[] = [];
  const iterator = octokit.paginate.iterator(octokit.rest.repos.listBranches, {
    owner,
    repo,
    per_page: 100
  });
  for await (const { data } of iterator) {
    for (const b of data) branches.push(b.name);
  }

  return new Response(JSON.stringify({ branches }), {
    headers: { "Content-Type": "application/json" }
  });
}