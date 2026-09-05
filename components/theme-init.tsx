import { THEME_STORAGE_KEY } from "@/lib/theme";

const themeInitScript = `
(function () {
  var STORAGE_KEY = ${JSON.stringify(THEME_STORAGE_KEY)};
  var mq = window.matchMedia("(prefers-color-scheme: dark)");

  function resolveDark(preference) {
    if (preference === "light") return false;
    if (preference === "dark") return true;
    return mq.matches;
  }

  function apply() {
    var stored = localStorage.getItem(STORAGE_KEY);
    var preference =
      stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : "system";
    var isDark = resolveDark(preference);
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }

  apply();

  mq.addEventListener("change", function () {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (!stored || stored === "system") {
      apply();
    }
  });

  window.addEventListener("storage", function (event) {
    if (event.key === STORAGE_KEY) {
      apply();
    }
  });
})();
`;

/** Inline script to apply theme class before first paint (no flash). */
export function ThemeInit() {
  return (
    <script
      id="theme-init"
      dangerouslySetInnerHTML={{ __html: themeInitScript }}
    />
  );
}
