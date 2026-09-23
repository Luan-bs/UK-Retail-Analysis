# UK Retail Dashboard

Dashboard estático em Vite, JavaScript puro e Plotly.js. Os arquivos JSON não são duplicados manualmente: o script `scripts/copy-data.mjs` copia os dados da fonte original para `public/data` durante `dev` e `build`.

## Estrutura esperada

A pasta deve estar em `uk-retail-analysis/dashboard`, com os dados originais em:

```text
uk-retail-analysis/src/scripts/data/json/
```

Arquivos obrigatórios:

- `fact_all.json`
- `dim_date.json`
- `dim_country.json`
- `dim_product.json`
- `dim_customer.json`
- `most_purchased_products.json`
- `rfm.json`

## Executar localmente

```bash
cd dashboard
npm install
npm run dev
```

## Gerar produção

```bash
npm run build
npm run preview
```

## Alterar o caminho público dos dados

Edite `src/config.js`:

```js
export const DATA_BASE_PATH = '/data';
```

Se os arquivos forem hospedados em outro domínio ou CDN, use, por exemplo:

```js
export const DATA_BASE_PATH = 'https://cdn.exemplo.com/uk-retail';
```

## Deploy

Na Vercel, configure `dashboard` como Root Directory. O comando de build é `npm run build` e a saída é `dist`.

No Netlify, use Base directory `dashboard`, Build command `npm run build` e Publish directory `dashboard/dist`.

## Regra financeira implementada

O dashboard calcula os valores sobre `fact_all.json`:

- Gross Sales: soma positiva dos registros `Sale`;
- Net Sales: Gross Sales mais os registros `Cancellation`, que já vêm negativos;
- não utiliza `metrics.json`;
- não utiliza `fact_fees`;
- pedidos são contados por `InvoiceNo` em registros `Sale`.

A aba de clientes usa `rfm.json` como uma base já calculada e, nesta primeira versão, não é recalculada pelos filtros de ano e país.
