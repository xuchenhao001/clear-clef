import Script from "next/script";

const themeInitScript = `
(function () {
  var mq = window.matchMedia("(prefers-color-scheme: dark)");
  function apply() {
    document.documentElement.classList.toggle("dark", mq.matches);
  }
  apply();
  mq.addEventListener("change", apply);
})();
`;

export function ThemeInit() {
  return (
    <Script id="theme-init" strategy="beforeInteractive">
      {themeInitScript}
    </Script>
  );
}
