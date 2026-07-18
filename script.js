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
    .filter((row) => row[MONTH_COLUMN] != null && row[RUCI_COLUMN] != null)
    .map((row) => ({ month: formatMonth(row[MONTH_COLUMN]), value: Number(row[RUCI_COLUMN]) }))
    .filter((row) => row.month && Number.isFinite(row.value));
}

function renderRuciChart(data) {
  const canvas = document.getElementById('ruci-chart');
  if (!canvas) return;

  const observedMaximum = Math.max(...data.map((row) => row.value));
  const yAxisMaximum = Math.max(1100, Math.ceil((observedMaximum * 1.1) / 100) * 100);

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.map((row) => row.month),
      datasets: [{
        label: 'RUCI Europe',
        data: data.map((row) => row.value),
        borderColor: '#355f8a',
        borderWidth: 1.8,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#355f8a',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        tension: 0,
      }],
    },
    options: {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (item) => `RUCI Europe: ${item.parsed.y}` } },
      },
      scales: {
        x: {
          title: { display: true, text: 'Month' },
          grid: { color: '#e7e9eb' },
          ticks: { maxTicksLimit: 8 },
        },
        y: {
          min: 0,
          max: yAxisMaximum,
          title: { display: true, text: 'RUCI Europe' },
          grid: { color: '#e7e9eb' },
        },
      },
    },
  });
}

async function loadRuciChart() {
  const response = await fetch(DATA_FILE);
  if (!response.ok) throw new Error(`Unable to load ${DATA_FILE}`);
  const workbook = XLSX.read(await response.arrayBuffer(), { type: 'array', cellDates: true });
  const rows = findRuciWorksheet(workbook);
  if (!rows) throw new Error(`No worksheet contains ${MONTH_COLUMN} and ${RUCI_COLUMN}`);
  const data = parseRuciRows(rows);
  if (!data.length) throw new Error('No RUCI Europe rows found');
  renderRuciChart(data);
}

window.addEventListener('DOMContentLoaded', () => {
  const year = document.getElementById('year');
  const status = document.getElementById('chart-status');
  if (year) year.textContent = new Date().getFullYear();
  if (!document.getElementById('ruci-chart')) return;
  loadRuciChart().catch((error) => {
    console.error(error);
    if (status) status.textContent = 'The RUCI Europe chart could not be loaded.';
  });
});
