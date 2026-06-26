export function isStaleAuthSessionError(
  error: { code?: string; message?: string } | null | undefined
): boolean {
  if (!error) return false;

  return (
    error.code === "refresh_token_not_found" ||
    error.code === "invalid_refresh_token" ||
    error.code === "session_not_found" ||
    error.message?.includes("Refresh Token Not Found") === true ||
    error.message?.includes("Invalid Refresh Token") === true
  );
}
