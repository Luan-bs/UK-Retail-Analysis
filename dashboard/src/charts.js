import { COLORS } from './config.js';

const layoutBase = {
  paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)',
  font: { family: 'DM Sans', color: '#e8e8f0', size: 12 },
  margin: { l: 45, r: 15, t: 15, b: 45 },
  xaxis: { gridcolor: '#2a2a3d', zerolinecolor: '#2a2a3d' },
  yaxis: { gridcolor: '#2a2a3d', zerolinecolor: '#2a2a3d' },
  colorway: COLORS,
  hoverlabel: { bgcolor: '#1a1a26', bordercolor: '#2a2a3d' }
};

const money = value => `£${Number(value || 0).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
const plot = (id, traces, extra = {}) => window.Plotly.newPlot(id, traces, { ...layoutBase, ...extra }, { responsive: true, displayModeBar: false });

export function renderOverviewCharts(filtered, sales, countrySales) {
  const monthly = new Map();
  for (const row of sales) {
    const key = `${row.Year}-${String(row.Month || 0).padStart(2, '0')}`;
    monthly.set(key, (monthly.get(key) || 0) + row.total_value);
  }
  const months = [...monthly.keys()].sort();
  plot('monthly-chart', [{ x: months, y: months.map(k => monthly.get(k)), type: 'scatter', mode: 'lines+markers', line: { color: '#7c6af7', width: 2.5 }, fill: 'tozeroy', fillcolor: 'rgba(124,106,247,.12)' }], { yaxis: { ...layoutBase.yaxis, tickprefix: '£', tickformat: '.2s' } });

  const tx = new Map();
  filtered.forEach(row => tx.set(row.TransactionType || 'N/A', (tx.get(row.TransactionType || 'N/A') || 0) + 1));
  plot('transaction-type-chart', [{ labels: [...tx.keys()], values: [...tx.values()], type: 'pie', hole: .55, marker: { colors: COLORS }, textinfo: 'percent+label' }], { margin: { l: 10, r: 10, t: 10, b: 10 }, legend: { orientation: 'h', y: -0.1 } });

  const countries = countrySales.sort((a, b) => a.total - b.total).slice(-10);
  plot('country-chart', [{ x: countries.map(x => x.total), y: countries.map(x => x.label), type: 'bar', orientation: 'h', marker: { color: '#7c6af7' }, hovertemplate: '%{y}<br>£%{x:,.0f}<extra></extra>' }], { xaxis: { ...layoutBase.xaxis, tickprefix: '£', tickformat: '.2s' }, margin: { l: 100, r: 15, t: 15, b: 45 } });
}

export function renderCustomerCharts(rfm) {
  const clean = rfm.filter(row => Number.isFinite(Number(row.Frequency)) && Number.isFinite(Number(row.Monetary)));
  const qMon = [...clean].sort((a, b) => a.Monetary - b.Monetary)[Math.floor(clean.length * .97)]?.Monetary || Infinity;
  const qFreq = [...clean].sort((a, b) => a.Frequency - b.Frequency)[Math.floor(clean.length * .97)]?.Frequency || Infinity;
  const data = clean.filter(row => row.Monetary <= qMon && row.Frequency <= qFreq);
  const maxRecency = Math.max(...data.map(x => Number(x.Recency) || 0), 0);
  plot('rfm-chart', [{ x: data.map(x => x.Frequency), y: data.map(x => x.Monetary), mode: 'markers', type: 'scatter', text: data.map(x => `Cliente: ${x.CustomerID}`), customdata: data.map(x => [x.Recency]), marker: { size: data.map(x => Math.max(7, (maxRecency - Number(x.Recency) + 1) / 2)), color: data.map(x => x.Recency), colorscale: [['0', '#6af7c2'], ['.5', '#7c6af7'], ['1', '#f76a8a']], showscale: true, colorbar: { title: 'Recência' } }, hovertemplate: '%{text}<br>Frequência: %{x}<br>Monetário: £%{y:,.0f}<br>Recência: %{customdata[0]} dias<extra></extra>' }], { xaxis: { ...layoutBase.xaxis, title: 'Frequência (pedidos)' }, yaxis: { ...layoutBase.yaxis, title: 'Valor total (£)' } });
  const bins = 40, values = clean.map(x => Number(x.Recency) || 0);
  plot('recency-chart', [{ x: values, type: 'histogram', nbinsx: bins, marker: { color: '#7c6af7' } }], { xaxis: { ...layoutBase.xaxis, title: 'Dias desde última compra' } });
}

export function renderProductCharts(sales) {
  const units = aggregateProducts(sales, row => Math.max(row.Quantity, 0));
  const revenue = aggregateProducts(sales, row => row.total_value);
  const u = units.slice(0, 10).reverse(), r = revenue.slice(0, 10).reverse();
  plot('units-chart', [{ x: u.map(x => x.total), y: u.map(x => x.label.slice(0, 30)), type: 'bar', orientation: 'h', marker: { color: '#f7c26a' } }], { margin: { l: 160, r: 15, t: 15, b: 45 } });
  plot('revenue-chart', [{ x: r.map(x => x.total), y: r.map(x => x.label.slice(0, 30)), type: 'bar', orientation: 'h', marker: { color: '#6af7c2' }, hovertemplate: '£%{x:,.0f}<extra></extra>' }], { margin: { l: 160, r: 15, t: 15, b: 45 }, xaxis: { ...layoutBase.xaxis, tickprefix: '£', tickformat: '.2s' } });
  const prefixes = new Map();
  sales.forEach(row => { const prefix = String(row.StockCode || 'N/A').slice(0, 2); prefixes.set(prefix, (prefixes.get(prefix) || 0) + row.total_value); });
  const p = [...prefixes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  plot('prefix-chart', [{ labels: p.map(x => x[0]), values: p.map(x => x[1]), type: 'treemap', parents: p.map(() => ''), marker: { colors: p.map(x => x[1]), colorscale: 'Viridis' } }], { margin: { l: 5, r: 5, t: 5, b: 5 } });
}

function aggregateProducts(sales, valueFn) {
  const map = new Map();
  sales.forEach(row => { const code = row.StockCode || 'N/A'; const item = map.get(code) || { label: row.ProductDescription || code, total: 0 }; item.total += valueFn(row); map.set(code, item); });
  return [...map.values()].sort((a, b) => b.total - a.total);
}

export function renderTransactionCharts(sales) {
  const dowOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const byDay = new Map(); sales.forEach(row => byDay.set(row.Weekday || 'N/A', (byDay.get(row.Weekday || 'N/A') || 0) + row.total_value));
  plot('weekday-chart', [{ x: dowOrder, y: dowOrder.map(x => byDay.get(x) || 0), type: 'bar', marker: { color: '#7c6af7' } }], { yaxis: { ...layoutBase.yaxis, tickprefix: '£', tickformat: '.2s' } });
  const byHour = new Map(); sales.forEach(row => byHour.set(row.Hour, (byHour.get(row.Hour) || 0) + row.total_value));
  const hours = [...byHour.keys()].sort((a, b) => a - b);
  plot('hour-chart', [{ x: hours, y: hours.map(x => byHour.get(x)), type: 'scatter', mode: 'lines', line: { color: '#f7c26a', width: 2 }, fill: 'tozeroy', fillcolor: 'rgba(247,194,106,.15)' }], { xaxis: { ...layoutBase.xaxis, title: 'Hora' }, yaxis: { ...layoutBase.yaxis, tickprefix: '£', tickformat: '.2s' } });
}

export { money };
