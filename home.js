const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const themeLabel = themeToggle?.querySelector(".theme-label");

function readSavedTheme() {
  try {
    const savedTheme = localStorage.getItem("theme");

    return savedTheme === "light" || savedTheme === "dark"
      ? savedTheme
      : null;
  } catch {
    return null;
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // The theme still works when storage is unavailable.
  }
}

function applyTheme(theme, persist = false) {
  const isDark = theme === "dark";

  root.dataset.theme = isDark ? "dark" : "light";

  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(isDark));
    themeToggle.setAttribute(
      "aria-label",
      isDark ? "Switch to light theme" : "Switch to dark theme"
    );
  }

  if (themeLabel) {
    themeLabel.textContent = "Theme";
  }

  if (persist) {
    saveTheme(root.dataset.theme);
  }
}

const savedTheme = readSavedTheme();

const preferredTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
  ? "dark"
  : "light";

applyTheme(savedTheme || preferredTheme);

themeToggle?.addEventListener("click", () => {
  const nextTheme =
    root.dataset.theme === "dark" ? "light" : "dark";

  applyTheme(nextTheme, true);
});
