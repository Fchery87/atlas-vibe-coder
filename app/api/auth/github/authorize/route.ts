import { cookies } from "next/headers";

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function GET(req: Request) {
  const clientId = requiredEnv("GITHUB_CLIENT_ID");
  const urlObj = new URL(req.url);
  const origin = `${urlObj.protocol}//${urlObj.host}`;
  const redirectUri = `${origin}/api/auth/github/callback`;

  const state = crypto.randomUUID();
  cookies().set("gh_oauth_state", state, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: 600
  });

  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("scope", "repo read:org user");
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("state", state);

  return Response.redirect(authUrl.toString(), 302);
}