import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { ThemeInit } from "@/components/theme-init";
import appCss from "@/src/styles/globals.css?url";
import fontsCss from "@/src/styles/fonts.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        title: "ClearClef",
      },
      {
        name: "description",
        content:
          "Public catalog of Common Western Musical Notation scores. MusicXML on Cloudflare.",
      },
    ],
    links: [
      { rel: "stylesheet", href: fontsCss },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/icon.svg", type: "image/svg+xml" },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <ThemeInit />
        <HeadContent />
      </head>
      <body className="flex min-h-full flex-col font-sans">
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}
