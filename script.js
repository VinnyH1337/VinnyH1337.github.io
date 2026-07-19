const DATA_FILE = "ruci_europe.xlsx";
const MONTH_COLUMN = "month";
const RUCI_COLUMN = "RUCI_Europe";

const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");
const themeLabel = themeToggle?.querySelector(".theme-label");

let ruciChart = null;
let ruciData = [];

function findRuciWorksheet(workbook) {
  return workbook.SheetNames
    .map((name) =>
      XLSX.utils.sheet_to_json(
        workbook.Sheets[name],
        { defval: null }
      )
    )
    .find((rows) =>
      rows.some(
        (row) =>
          MONTH_COLUMN in row &&
          RUCI_COLUMN in row
      )
    );
}

function formatMonth(value) {
  if (value instanceof Date) {
    return value.toLocaleDateString(
      "en",
      {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }
    );
  }

  return String(value ?? "").trim();
}

function parseRuciRows(rows) {
  return rows
    .filter(
      (row) =>
        row[MONTH_COLUMN] != null &&
        row[RUCI_COLUMN] != null
    )
    .map((row) => ({
      month: formatMonth(row[MONTH_COLUMN]),
      value: Number(row[RUCI_COLUMN]),
    }))
    .filter(
      (row) =>
        row.month &&
        Number.isFinite(row.value)
    );
}

function getCssVariable(name) {
  return getComputedStyle(root)
    .getPropertyValue(name)
    .trim();
}

function getChartColors() {
  return {
    line: getCssVariable("--chart-line") || "#355f8a",
    grid: getCssVariable("--chart-grid") || "#e7e9eb",
    text: getCssVariable("--chart-text") || "#667587",
    paper: getCssVariable("--paper") || "#ffffff",
  };
}

function renderRuciChart(data) {
  const canvas = document.getElementById("ruci-chart");

  if (!canvas) {
    return;
  }

  const colors = getChartColors();
  const yAxisMaximum = 1200;

  if (ruciChart) {
    ruciChart.destroy();
  }

  ruciChart = new Chart(canvas, {
    type: "line",

    data: {
      labels: data.map((row) => row.month),

      datasets: [
        {
          label: "RUCI Europe",

          data: data.map((row) => row.value),

          borderColor: colors.line,
          borderWidth: 1.8,

          pointRadius: 0,
          pointHoverRadius: 4,

          pointHoverBackgroundColor: colors.line,
          pointHoverBorderColor: colors.paper,
          pointHoverBorderWidth: 2,

          tension: 0,
        },
      ],
    },

    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,

      interaction: {
        intersect: false,
        mode: "index",
      },

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          backgroundColor: colors.paper,
          titleColor: colors.text,
          bodyColor: colors.text,
          borderColor: colors.grid,
          borderWidth: 1,

          callbacks: {
            label: (item) =>
              `RUCI Europe: ${item.parsed.y}`,
          },
        },
      },

      scales: {
        x: {
          title: {
            display: true,
            text: "Month",
            color: colors.text,

            font: {
              family: '"Times New Roman", Times, serif',
              size: 13,
            },
          },

          grid: {
            color: colors.grid,
          },

          ticks: {
            color: colors.text,
            maxTicksLimit: 8,

            font: {
              family: '"Times New Roman", Times, serif',
              size: 12,
            },
          },
        },

        y: {
          min: 0,
          max: yAxisMaximum,

          title: {
            display: true,
            text: "RUCI Europe",
            color: colors.text,

            font: {
              family: '"Times New Roman", Times, serif',
              size: 13,
            },
          },

          grid: {
            color: colors.grid,
          },

          ticks: {
            color: colors.text,

            font: {
              family: '"Times New Roman", Times, serif',
              size: 12,
            },
          },
        },
      },
    },
  });
}

async function loadRuciChart() {
  const response = await fetch(DATA_FILE);

  if (!response.ok) {
    throw new Error(`Unable to load ${DATA_FILE}`);
  }

  const workbook = XLSX.read(
    await response.arrayBuffer(),
    {
      type: "array",
      cellDates: true,
    }
  );

  const rows = findRuciWorksheet(workbook);

  if (!rows) {
    throw new Error(
      `No worksheet contains ${MONTH_COLUMN} and ${RUCI_COLUMN}`
    );
  }

  ruciData = parseRuciRows(rows);

  if (!ruciData.length) {
    throw new Error("No RUCI Europe rows found");
  }

  renderRuciChart(ruciData);
}

function applyTheme(theme, saveTheme = true) {
  const isDark = theme === "dark";

  root.dataset.theme = theme;

  if (themeToggle) {
    themeToggle.setAttribute(
      "aria-pressed",
      String(isDark)
    );

    themeToggle.setAttribute(
      "aria-label",
      isDark
        ? "Switch to light mode"
        : "Switch to dark mode"
    );
  }

  if (themeLabel) {
    themeLabel.textContent =
      isDark
        ? "Dark Mode"
        : "Light Mode";
  }

  if (saveTheme) {
    localStorage.setItem("theme", theme);
  }

  if (ruciData.length) {
    renderRuciChart(ruciData);
  }
}

function initialiseTheme() {
  const savedTheme =
    localStorage.getItem("theme");

  const preferredTheme =
    window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches
      ? "dark"
      : "light";

  applyTheme(
    savedTheme || preferredTheme,
    false
  );
}

window.addEventListener(
  "DOMContentLoaded",
  () => {
    const year =
      document.getElementById("year");

    const status =
      document.getElementById("chart-status");

    if (year) {
      year.textContent =
        new Date().getFullYear();
    }

    initialiseTheme();

    themeToggle?.addEventListener(
      "click",
      () => {
        const nextTheme =
          root.dataset.theme === "dark"
            ? "light"
            : "dark";

        applyTheme(nextTheme);
      }
    );

    if (
      !document.getElementById("ruci-chart")
    ) {
      return;
    }

    loadRuciChart().catch((error) => {
      console.error(error);

      if (status) {
        status.textContent =
          "The RUCI Europe chart could not be loaded.";
      }
    });
  }
);
