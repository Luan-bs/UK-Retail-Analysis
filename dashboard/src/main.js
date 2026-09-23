import { loadData } from './data-loader.js';
import { filterFact, salesOnly, groupSum, calculateMetrics, recentTransactions } from './calculations.js';
import { renderOverviewCharts, renderCustomerCharts, renderProductCharts, renderTransactionCharts, money } from './charts.js';
import './styles.css';

const state = { data: null, filters: { year: 'Todos', country: 'Todos' }, activeTab: 'overview' };
const $ = selector => document.querySelector(selector);
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
const integer = value => Number(value || 0).toLocaleString('en-GB', { maximumFractionDigits: 0 });
const compactMoney = value => Math.abs(value) >= 1e6 ? `£${(value / 1e6).toFixed(2)}M` : money(value);

function card(label, value, accent = '') { return `<article class="metric-card ${accent}"><span>${label}</span><strong>${value}</strong></article>`; }
function chartBox(title, id, extra = '') { return `<div class="chart-card ${extra}"><div class="section-title">${title}</div><div id="${id}" class="chart"></div></div>`; }

function populateFilters(fact) {
  const years = [...new Set(fact.map(row => row.Year).filter(Boolean))].sort((a, b) => a - b);
  const countries = [...new Set(fact.map(row => row.Country).filter(Boolean))].sort();
  $('#year-filter').innerHTML = ['Todos', ...years].map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
  $('#country-filter').innerHTML = ['Todos', ...countries].map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
  $('#year-filter').addEventListener('change', e => { state.filters.year = e.target.value; renderCurrent(); });
  $('#country-filter').addEventListener('change', e => { state.filters.country = e.target.value; renderCurrent(); });
}

function renderOverview(filtered) {
  const sales = salesOnly(filtered), metrics = calculateMetrics(filtered);
  $('#overview').innerHTML = `<div class="metrics-grid">${card('Gross Sales', compactMoney(metrics.grossSales), 'purple')}${card('Net Sales', compactMoney(metrics.netSales), 'green')}${card('Total Orders', integer(metrics.totalOrders))}${card('Clientes Únicos', integer(metrics.distinctCustomers))}${card('Produtos Únicos', integer(metrics.distinctProducts))}${card('Unidades Vendidas', integer(metrics.productUnitsSold))}${card('Ticket Médio', money(metrics.averageOrder), 'gold')}${card('Taxa Cancelamento', `${metrics.cancellationRate.toFixed(1)}%`, 'pink')}</div><div class="charts-grid two-one">${chartBox('VENDAS MENSAIS', 'monthly-chart', 'wide')}${chartBox('TIPO DE TRANSAÇÃO', 'transaction-type-chart')}</div>${chartBox('TOP 10 PAÍSES POR VENDAS', 'country-chart')}`;
  renderOverviewCharts(filtered, sales, groupSum(sales, 'Country'));
}

function renderCustomers() {
  const rfm = state.data.rfm || [];
  const averages = rfm.reduce((a, row) => ({ recency: a.recency + Number(row.Recency || 0), frequency: a.frequency + Number(row.Frequency || 0), monetary: a.monetary + Number(row.Monetary || 0) }), { recency: 0, frequency: 0, monetary: 0 });
  const n = rfm.length || 1;
  const top = [...rfm].sort((a, b) => Number(b.Monetary || 0) - Number(a.Monetary || 0)).slice(0, 10);
  $('#customers').innerHTML = `<h2>Análise RFM de Clientes</h2><p class="subtitle">Recency · Frequency · Monetary — segmentação da base de clientes</p><div class="metrics-grid three">${card('Recência Média', `${(averages.recency / n).toFixed(0)} dias`)}${card('Frequência Média', `${(averages.frequency / n).toFixed(1)} pedidos`)}${card('Monetário Médio', money(averages.monetary / n), 'green')}</div>${chartBox('FREQUÊNCIA × MONETÁRIO', 'rfm-chart') }<div class="charts-grid two-one">${chartBox('DISTRIBUIÇÃO DE RECÊNCIA', 'recency-chart') }<div class="table-card"><div class="section-title">TOP 10 CLIENTES POR VALOR</div>${customerTable(top)}</div></div>`;
  renderCustomerCharts(rfm);
}
function customerTable(rows) { return `<div class="table-scroll"><table><thead><tr><th>CustomerID</th><th>Monetary</th><th>Frequency</th><th>Recency</th></tr></thead><tbody>${rows.map(row => `<tr><td>${esc(row.CustomerID)}</td><td>${money(row.Monetary)}</td><td>${integer(row.Frequency)}</td><td>${integer(row.Recency)} dias</td></tr>`).join('')}</tbody></table></div>`; }

function renderProducts(filtered) {
  const sales = salesOnly(filtered);
  $('#products').innerHTML = `<h2>Análise de Produtos</h2><div class="charts-grid two-one">${chartBox('TOP 10 PRODUTOS POR UNIDADES VENDIDAS', 'units-chart')}${chartBox('TOP 10 PRODUTOS POR RECEITA', 'revenue-chart')}</div>${chartBox('RECEITA POR CATEGORIA (STOCKCODE PREFIX)', 'prefix-chart')}`;
  renderProductCharts(sales);
}

function renderTransactions(filtered) {
  const sales = salesOnly(filtered), rows = recentTransactions(filtered);
  const countryTotals = new Map();
  for (const row of sales) { const c = countryTotals.get(row.Country) || { total: 0, orders: new Set() }; c.total += row.total_value; c.orders.add(row.InvoiceNo); countryTotals.set(row.Country, c); }
  const countries = [...countryTotals.entries()].map(([label, x]) => ({ label, total: x.total, orders: x.orders.size, aov: x.orders.size ? x.total / x.orders.size : 0 })).sort((a, b) => b.aov - a.aov).slice(0, 15);
  $('#transactions').innerHTML = `<h2>Análise de Transações</h2><div class="charts-grid two-one">${chartBox('VENDAS POR DIA DA SEMANA', 'weekday-chart')}${chartBox('VENDAS POR HORA DO DIA', 'hour-chart')}</div>${chartBox('VALOR MÉDIO DO PEDIDO POR PAÍS (TOP 15)', 'aov-chart')}<div class="table-card"><div class="section-title">AMOSTRA DE TRANSAÇÕES RECENTES</div>${transactionTable(rows)}</div>`;
  renderTransactionCharts(sales);
  const aov = countries;
  window.Plotly.newPlot('aov-chart', [{ x: aov.map(x => x.orders), y: aov.map(x => x.aov), text: aov.map(x => x.label), mode: 'markers+text', textposition: 'top center', type: 'scatter', marker: { size: aov.map(x => Math.max(10, Math.sqrt(x.total) / 3)), color: aov.map(x => x.aov), colorscale: 'Viridis', showscale: false }, hovertemplate: '%{text}<br>AOV: £%{y:,.2f}<br>Pedidos: %{x}<extra></extra>' }], { paper_bgcolor: 'rgba(0,0,0,0)', plot_bgcolor: 'rgba(0,0,0,0)', font: { color: '#e8e8f0' }, margin: { l: 55, r: 15, t: 15, b: 45 }, xaxis: { title: 'Pedidos', gridcolor: '#2a2a3d' }, yaxis: { title: 'AOV (£)', tickprefix: '£', gridcolor: '#2a2a3d' } }, { responsive: true, displayModeBar: false });
}
function transactionTable(rows) { return `<div class="table-scroll"><table><thead><tr><th>Data</th><th>Invoice</th><th>Produto</th><th>País</th><th>Qtd.</th><th>Unit Price</th><th>Total</th><th>Tipo</th></tr></thead><tbody>${rows.map(row => `<tr><td>${esc(row.InvoiceDate)}</td><td>${esc(row.InvoiceNo)}</td><td title="${esc(row.ProductDescription)}">${esc(String(row.ProductDescription || '').slice(0, 35))}</td><td>${esc(row.Country)}</td><td>${integer(row.Quantity)}</td><td>${money(row.UnitPrice)}</td><td>${money(row.total_value)}</td><td><span class="tag">${esc(row.TransactionType)}</span></td></tr>`).join('')}</tbody></table></div>`; }

function renderCurrent() {
  const filtered = filterFact(state.data.fact, state.filters);
  $('#transaction-count').textContent = integer(filtered.length);
  ['overview', 'customers', 'products', 'transactions'].forEach(tab => { $(`#${tab}`).hidden = tab !== state.activeTab; });
  if (state.activeTab === 'overview') renderOverview(filtered);
  if (state.activeTab === 'customers') renderCustomers();
  if (state.activeTab === 'products') renderProducts(filtered);
  if (state.activeTab === 'transactions') renderTransactions(filtered);
}

function setupTabs() { document.querySelectorAll('.tab').forEach(button => button.addEventListener('click', () => { state.activeTab = button.dataset.tab; document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === button)); renderCurrent(); })); }

async function init() {
  try { state.data = await loadData(); populateFilters(state.data.fact); setupTabs(); $('#loading').hidden = true; $('#app').hidden = false; renderCurrent(); }
  catch (error) { $('#loading').hidden = true; $('#error').hidden = false; $('#error').textContent = `Erro ao carregar o dashboard: ${error.message}`; console.error(error); }
}
init();
