import { DATA_FILES, DATA_URL } from './config.js';

async function loadJson(fileName) {
  const response = await fetch(DATA_URL(fileName));
  if (!response.ok) {
    throw new Error(`Não foi possível carregar ${DATA_URL(fileName)} (${response.status})`);
  }
  return response.json();
}

const number = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function loadData() {
  const entries = Object.entries(DATA_FILES);
  const values = await Promise.all(entries.map(([, file]) => loadJson(file)));
  const raw = Object.fromEntries(entries.map(([key], index) => [key, values[index]]));

  const dates = new Map(raw.dimDate.map(row => [String(row.DateID), row]));
  const countries = new Map(raw.dimCountry.map(row => [String(row.CountryID), row]));
  const products = new Map(raw.dimProduct.map(row => [String(row.StockCode), row]));

  const fact = raw.fact.map(row => {
    const date = dates.get(String(row.DateID)) || {};
    const country = countries.get(String(row.CountryID)) || {};
    const product = products.get(String(row.StockCode)) || {};

    return {
      ...row,
      ...date,
      ...country,
      ...product,
      Quantity: number(row.Quantity),
      UnitPrice: number(row.UnitPrice),
      total_value: number(row.total_value),
      Hour: number(row.Hour),
      Year: number(row.Year)
    };
  });

  return { ...raw, fact };
}
