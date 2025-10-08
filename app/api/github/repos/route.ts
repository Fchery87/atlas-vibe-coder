import { Octokit } from "@octokit/rest";
import { cookies } from "next/headers";

export async function GET() {
  const token = cookies().get("gh_access_token")?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: "not_authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  const octokit = new Octokit({ auth: token });

  // Paginate repos for the authenticated user
  const repos: any[] = [];
  const iterator = octokit.paginate.iterator(octokit.rest.repos.listForAuthenticatedUser, {
    per_page: 100,
    visibility: "all",
    affiliation: "owner,collaborator,organization_member"
  });
  for await (const { data } of iterator) {
    for (const r of data) {
      repos.push({
        id: r.id,
        full_name: r.full_name,
        private: r.private,
        default_branch: r.default_branch,
        permissions: r.permissions,
        html_url: r.html_url
      });
    }
  }

  return new Response(JSON.stringify({ repos }), {
    headers: { "Content-Type": "application/json" }
  });
}