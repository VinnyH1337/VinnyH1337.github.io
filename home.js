const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const themeLabel = themeToggle?.querySelector(".theme-label");

function applyTheme(theme) {
  const isDark = theme === "dark";

  root.dataset.theme = theme;

  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light mode" : "Switch to dark mode"
    );
  }

  if (themeLabel) {
    themeLabel.textContent = isDark ? "Dark Mode" : "Light Mode";
  }

  localStorage.setItem("theme", theme);
}

const savedTheme = localStorage.getItem("theme");

const initialTheme =
  savedTheme ||
  (window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light");

applyTheme(initialTheme);

themeToggle?.addEventListener("click", () => {
  const nextTheme =
    root.dataset.theme === "dark"
      ? "light"
      : "dark";

  applyTheme(nextTheme);
});
