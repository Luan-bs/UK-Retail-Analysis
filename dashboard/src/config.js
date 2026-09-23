// Altere este caminho se os JSON forem publicados em outro local.
// Em Vercel/Netlify, o caminho deve começar com '/'.
export const DATA_BASE_PATH = '/data';

export const DATA_FILES = {
  fact: 'fact_all.json',
  dimDate: 'dim_date.json',
  dimCountry: 'dim_country.json',
  dimProduct: 'dim_product.json',
  dimCustomer: 'dim_customer.json',
  products: 'most_purchased_products.json',
  rfm: 'rfm.json'
};

export const DATA_URL = (fileName) =>
  `${DATA_BASE_PATH}/${fileName}`;

export const COLORS = [
  '#7c6af7',
  '#f7c26a',
  '#6af7c2',
  '#f76a8a',
  '#6aabf7',
  '#c26af7',
  '#f7a06a',
  '#a0f76a'
];
