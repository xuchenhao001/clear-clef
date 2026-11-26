const ADMIN_ROOT = "/admin";

/**
 * Only allow post-login navigation inside the admin area. The `next` search
 * parameter is user-controlled, so never pass it to the router unchecked.
 */
export function safeAdminNextPath(value: string | undefined): string {
  if (!value) {
    return ADMIN_ROOT;
  }
  if (
    value !== ADMIN_ROOT &&
    !value.startsWith(`${ADMIN_ROOT}/`)
  ) {
    return ADMIN_ROOT;
  }
  if (value.includes("\\") || value.startsWith("//")) {
    return ADMIN_ROOT;
  }
  return value;
}
