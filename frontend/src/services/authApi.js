import { getCurrentUser, request } from "./apiClient.js";

export async function requestAuth(mode, formData) {
  const username = formData.email.trim();

  if (mode === "sign-up") {
    await request("/users/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password: formData.password,
        full_name: formData.fullName.trim(),
      }),
    });
  }

  const body = new URLSearchParams();
  body.set("username", username);
  body.set("password", formData.password);

  const tokenPayload = await request("/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const user = await getCurrentUser(tokenPayload.access_token);

  return {
    ...tokenPayload,
    accessToken: tokenPayload.access_token,
    token: tokenPayload.access_token,
    user,
  };
}
