export type UserLike = {
  username?: string;
  favoriteSports?: string[];
  bio?: string;
  role?: string;
};

/**
 * Returns a short, non-PII subtitle for a user.
 * Prioritizes favoriteSports; falls back to role; otherwise empty.
 */
export function getUserSubtitle(u: UserLike | any): string {
  try {
    const sports = Array.isArray(u?.favoriteSports)
      ? u.favoriteSports.filter(Boolean).join(", ")
      : "";
    if (sports) return sports;

    const role = typeof u?.role === "string" ? u.role : "";
    if (role && role.toUpperCase() !== "ADMIN") return role;

    // Avoid bio for now (could be long); keep subtitle concise
    return "";
  } catch {
    return "";
  }
}
