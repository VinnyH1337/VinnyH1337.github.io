const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const themeLabel = document.querySelector(".theme-label");

function applyTheme(theme) {
  const isDark = theme === "dark";

  root.dataset.theme = theme;

  if (themeToggle) {
    themeToggle.checked = isDark;
    themeToggle.setAttribute("aria-checked", String(isDark));
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

themeToggle?.addEventListener("change", () => {
  applyTheme(themeToggle.checked ? "dark" : "light");
});
