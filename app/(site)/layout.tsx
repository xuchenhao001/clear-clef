import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-edition-canvas text-edition-ink">
      <SiteHeader />
      {children}
    </div>
  );
}
