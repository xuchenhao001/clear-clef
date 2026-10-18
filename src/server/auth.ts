import { createServerFn } from "@tanstack/react-start";
import { needsAdminSetup, requireAdminSession } from "@/lib/auth";

export const checkNeedsAdminSetup = createServerFn({ method: "GET" }).handler(
  async () => needsAdminSetup(),
);

export const loadAdminSession = createServerFn({ method: "GET" }).handler(
  async () => requireAdminSession(),
);
