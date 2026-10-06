import type { SupabaseClient, User } from "@supabase/supabase-js";

export async function ensureUserProfile(client: SupabaseClient, user: User) {
  const fullName =
    typeof user.user_metadata.full_name === "string"
      ? user.user_metadata.full_name
      : user.email?.split("@")[0] ?? "ResumeIQ member";

  const { error } = await client.from("profiles").insert({
    id: user.id,
    full_name: fullName,
    email: user.email ?? null,
  });

  if (error && error.code !== "23505") {
    const detail = process.env.NODE_ENV === "development"
      ? ` Development detail: ${error.code ? `${error.code}: ` : ""}${error.message}`
      : "";

    throw new Error(`Your account is ready, but we couldn't finish setting up your profile. Please try again.${detail}`);
  }
}