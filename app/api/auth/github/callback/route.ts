import { cookies } from "next/headers";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function GET(req: Request) {
  const urlObj = new URL(req.url);
  const origin = `${urlObj.protocol}//${urlObj.host}`;
  const code = urlObj.searchParams.get("code");
  const state = urlObj.searchParams.get("state");
  const cookieState = cookies().get("gh_oauth_state")?.value;

  if (!code || !state || state !== cookieState) {
    return new Response("Invalid OAuth state", { status: 400 });
  }

  const client_id = requiredEnv("GITHUB_CLIENT_ID");
  const client_secret = requiredEnv("GITHUB_CLIENT_SECRET");

  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id,
      client_secret,
      code,
      redirect_uri: `${origin}/api/auth/github/callback`,
      state
    })
  });

  if (!res.ok) {
    return new Response("OAuth exchange failed", { status: 500 });
  }

  const data = await res.json();
  const token: string | undefined = data.access_token;
  if (!token) {
    return new Response("No access_token returned", { status: 500 });
  }

  cookies().set("gh_access_token", token, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });
  try {
    cookies().delete("gh_oauth_state");
  } catch {}

  return Response.redirect(`${origin}/?gh=connected`, 302);
}