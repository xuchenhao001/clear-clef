if (!String(process.env.npm_config_user_agent ?? "").includes("pnpm")) {
  console.error("This repo uses pnpm only. Run: corepack enable && corepack prepare");
  process.exit(1);
}
