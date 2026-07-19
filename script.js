(() => {
  "use strict";

  const DATA_FILE = "ruci_europe.xlsx";
  const MONTH_COLUMN = "month";
  const RUCI_COLUMN = "RUCI_Europe";

  let ruciChart = null;
  let ruciData = [];

  function findRuciWorksheet(workbook) {
    return workbook.SheetNames
      .map((name) =>
        XLSX.utils.sheet_to_json(workbook.Sheets[name], {
          defval: null,
        })
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
      return value.toLocaleDateString("en", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
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
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

  function isDarkTheme() {
    return (
      document.documentElement.dataset.theme === "dark"
    );
  }

  function getChartColors() {
    const dark = isDarkTheme();

    return {
      line:
        getCssVariable("--chart-line") ||
        (dark ? "#70a8d5" : "#355f8a"),

      grid:
        getCssVariable("--chart-grid") ||
        (dark ? "#3d423f" : "#e7e9eb"),

      text:
        getCssVariable("--chart-text") ||
        (dark ? "#c1beb6" : "#667587"),

      paper:
        getCssVariable("--paper") ||
        (dark ? "#171a18" : "#ffffff"),
    };
  }

  function renderRuciChart(data) {
    const canvas =
      document.getElementById("ruci-chart");

    if (!canvas || typeof Chart === "undefined") {
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

            pointHoverBackgroundColor:
              colors.line,

            pointHoverBorderColor:
              colors.paper,

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

            titleFont: {
              family:
                '"Times New Roman", Times, serif',
            },

            bodyFont: {
              family:
                '"Times New Roman", Times, serif',
            },

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
                family:
                  '"Times New Roman", Times, serif',
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
                family:
                  '"Times New Roman", Times, serif',
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
                family:
                  '"Times New Roman", Times, serif',
                size: 13,
              },
            },

            grid: {
              color: colors.grid,
            },

            ticks: {
              color: colors.text,

              font: {
                family:
                  '"Times New Roman", Times, serif',
                size: 12,
              },
            },
          },
        },
      },
    });
  }

  async function loadRuciChart() {
    if (typeof XLSX === "undefined") {
      throw new Error(
        "The XLSX library did not load."
      );
    }

    if (typeof Chart === "undefined") {
      throw new Error(
        "The Chart.js library did not load."
      );
    }

    const response = await fetch(DATA_FILE);

    if (!response.ok) {
      throw new Error(
        `Unable to load ${DATA_FILE}: HTTP ${response.status}`
      );
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
        `No worksheet contains the columns "${MONTH_COLUMN}" and "${RUCI_COLUMN}".`
      );
    }

    ruciData = parseRuciRows(rows);

    if (!ruciData.length) {
      throw new Error(
        "No valid RUCI Europe rows were found."
      );
    }

    renderRuciChart(ruciData);
  }

  function watchThemeChanges() {
    const observer = new MutationObserver(
      (mutations) => {
        const themeChanged = mutations.some(
          (mutation) =>
            mutation.type === "attributes" &&
            mutation.attributeName ===
              "data-theme"
        );

        if (themeChanged && ruciData.length) {
          renderRuciChart(ruciData);
        }
      }
    );

    observer.observe(
      document.documentElement,
      {
        attributes: true,
        attributeFilter: ["data-theme"],
      }
    );
  }

  window.addEventListener(
    "DOMContentLoaded",
    () => {
      const status =
        document.getElementById("chart-status");

      const canvas =
        document.getElementById("ruci-chart");

      if (!canvas) {
        return;
      }

      watchThemeChanges();

      loadRuciChart().catch((error) => {
        console.error(error);

        if (status) {
          status.textContent =
            "The RUCI Europe chart could not be loaded.";
        }
      });
    }
  );
})();
