export const salesOnly = (rows) =>
  rows.filter(row => row.TransactionType === 'Sale');

export const cancellationsOnly = (rows) =>
  rows.filter(row => row.TransactionType === 'Cancellation');

export function filterFact(fact, { year = 'Todos', country = 'Todos' } = {}) {
  return fact.filter(row => {
    const yearOk = year === 'Todos' || row.Year === Number(year);
    const countryOk = country === 'Todos' || row.Country === country;
    return yearOk && countryOk;
  });
}

export function calculateMetrics(filtered) {
  const sales = salesOnly(filtered);
  const cancellations = cancellationsOnly(filtered);

  // Regra oficial atual: cancelamentos já vêm negativos e não há fact_fees.
  const grossSales = sales.reduce((sum, row) => sum + Math.max(row.total_value, 0), 0);
  const cancellationValue = cancellations.reduce((sum, row) => sum + row.total_value, 0);
  const netSales = grossSales + cancellationValue;
  const totalOrders = new Set(sales.map(row => row.InvoiceNo).filter(Boolean)).size;
  const distinctCustomers = new Set(filtered.map(row => row.CustomerID).filter(Boolean)).size;
  const distinctProducts = new Set(filtered.map(row => row.StockCode).filter(Boolean)).size;
  const productUnitsSold = sales.reduce((sum, row) => sum + Math.max(row.Quantity, 0), 0);
  const averageOrder = totalOrders ? netSales / totalOrders : 0;
  const cancellationRate = filtered.length ? cancellations.length / filtered.length * 100 : 0;

  return {
    grossSales,
    netSales,
    totalOrders,
    distinctCustomers,
    distinctProducts,
    productUnitsSold,
    averageOrder,
    cancellationRate
  };
}

export function groupSum(rows, key, value = 'total_value') {
  const grouped = new Map();
  for (const row of rows) {
    const group = row[key] ?? 'N/A';
    grouped.set(group, (grouped.get(group) || 0) + Number(row[value] || 0));
  }
  return [...grouped.entries()].map(([label, total]) => ({ label, total }));
}

export function groupCount(rows, key) {
  const grouped = new Map();
  for (const row of rows) {
    const group = row[key] ?? 'N/A';
    grouped.set(group, (grouped.get(group) || 0) + 1);
  }
  return [...grouped.entries()].map(([label, total]) => ({ label, total }));
}

export function topProductsByRevenue(sales, limit = 10) {
  const groups = new Map();
  for (const row of sales) {
    const code = row.StockCode ?? 'N/A';
    const current = groups.get(code) || { code, label: row.ProductDescription || code, total: 0 };
    current.total += row.total_value;
    groups.set(code, current);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}

export function topProductsByUnits(sales, limit = 10) {
  const groups = new Map();
  for (const row of sales) {
    const code = row.StockCode ?? 'N/A';
    const current = groups.get(code) || { code, label: row.ProductDescription || code, total: 0 };
    current.total += Math.max(row.Quantity, 0);
    groups.set(code, current);
  }
  return [...groups.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}

export function recentTransactions(rows, limit = 200) {
  return [...rows]
    .sort((a, b) => String(b.InvoiceDate || '').localeCompare(String(a.InvoiceDate || '')))
    .slice(0, limit);
}
