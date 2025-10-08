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
  const { data } = await octokit.users.getAuthenticated();
  return new Response(
    JSON.stringify({
      login: data.login,
      name: data.name,
      avatar_url: data.avatar_url
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}