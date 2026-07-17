const DATA_FILE = 'ruci_europe.xlsx';
const MONTH_COLUMN = 'month';
const RUCI_COLUMN = 'RUCI_Europe';

function findRuciWorksheet(workbook) {
  return workbook.SheetNames
    .map((name) => XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: null }))
    .find((rows) => rows.some((row) => MONTH_COLUMN in row && RUCI_COLUMN in row));
}

function formatMonth(value) {
  if (value instanceof Date) {
    return value.toLocaleDateString('en', { month: 'short', year: 'numeric', timeZone: 'UTC' });
  }

  return String(value ?? '').trim();
}

function parseRuciRows(rows) {
  return rows
    .filter((row) => row[MONTH_COLUMN] !== null && row[MONTH_COLUMN] !== undefined && row[RUCI_COLUMN] !== null && row[RUCI_COLUMN] !== undefined)
    .map((row) => ({
      month: formatMonth(row[MONTH_COLUMN]),
      value: Number(row[RUCI_COLUMN]),
    }))
    .filter((row) => row.month && Number.isFinite(row.value));
}

function renderRuciChart(data) {
  const canvas = document.getElementById('ruci-chart');

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.map((row) => row.month),
      datasets: [
        {
          label: 'RUCI Europe',
          data: data.map((row) => row.value),
          borderColor: '#173b6c',
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: '#173b6c',
          pointHoverBorderColor: '#ffffff',
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
        mode: 'index',
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: (items) => items[0]?.label ?? '',
            label: (item) => `RUCI Europe: ${item.parsed.y}`,
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'month',
          },
          grid: {
            color: '#e5e7eb',
          },
          ticks: {
            maxTicksLimit: 8,
          },
        },
        y: {
          title: {
            display: true,
            text: 'RUCI Europe',
          },
          grid: {
            color: '#e5e7eb',
          },
          beginAtZero: false,
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

  const workbook = XLSX.read(await response.arrayBuffer(), { type: 'array', cellDates: true });
  const rows = findRuciWorksheet(workbook);

  if (!rows) {
    throw new Error(`No worksheet contains ${MONTH_COLUMN} and ${RUCI_COLUMN}`);
  }

  const data = parseRuciRows(rows);

  if (!data.length) {
    throw new Error('No RUCI Europe rows found');
  }

  renderRuciChart(data);
}

window.addEventListener('DOMContentLoaded', () => {
  loadRuciChart().catch((error) => {
    console.error(error);
  });
});
