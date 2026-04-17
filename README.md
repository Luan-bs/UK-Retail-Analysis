# 🛒 UK Retail Analytics

[![Streamlit App](https://static.streamlit.io/badges/streamlit_badge_black_white.svg)](https://uk-retail.streamlit.app/)

Pipeline ETL completo + dashboard interativo para análise de dados de e-commerce do Reino Unido.

---

## 📊 Dashboard

**Acesse aqui:** [https://uk-retail.streamlit.app/](https://uk-retail.streamlit.app/)

O dashboard tem 4 abas principais:

- **Overview:** KPIs, vendas mensais, tipos de transação, top países
- **Clientes:** Análise RFM, segmentação, top clientes por valor
- **Produtos:** Produtos mais vendidos e performance
- **Transações:** Histórico completo com filtros

---

## 📈 Sobre os Dados

### Origem
- Dataset: Online Retail Dataset (Kaggle)
- Período: 2010-2011
- Registros brutos: 541.909
- Registros limpos: 539.273
- Países: 38
- Clientes: 4.373
- Produtos: 3.938

### Números Principais
| Métrica | Valor |
|---------|-------|
| Vendas Brutas | £10.350.459,74 |
| Vendas Líquidas | £9.149.361,98 |
| Total de Pedidos | 23.738 |
| Clientes Únicos | 4.373 |
| Produtos Únicos | 3.938 |
| Unidades Vendidas | 5.176.450 |
| Ticket Médio | £436,00 |

### Tipos de Transação
| Tipo | Quantidade | % |
|------|-----------|---|
| Vendas | 528.128 | 97,9% |
| Cancelamentos | 9.162 | 1,7% |
| Taxas | 1.983 | 0,4% |

---

## 📋 Estrutura dos Dados

### Tabela de Fatos: `fact_all`
Todas as transações com essas colunas:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| TransactionID | INT | ID único da transação |
| InvoiceNo | STRING | Número da nota fiscal |
| CustomerID | INT | ID do cliente |
| StockCode | STRING | Código do produto |
| DateID | INT | ID da data |
| CountryID | INT | ID do país |
| Quantity | INT | Quantidade |
| UnitPrice | DECIMAL | Preço unitário (£) |
| total_value | DECIMAL | Total da transação (£) |
| TransactionType | STRING | Tipo (Sale, Cancellation, Fee) |
| Year | INT | Ano |
| Month | INT | Mês |
| Country | STRING | Nome do país |

**Total:** 539.273 registros

---

### Tabelas de Dimensão

#### `dim_customer` (4.373 registros)
- CustomerID (PK)
- CountryID (FK)

#### `dim_product` (3.938 registros)
- StockCode (PK)
- ProductDescription

#### `dim_date` (23.260 registros)
- DateID (PK)
- InvoiceDate
- Year, Month, Day, DayOfWeek

#### `dim_country` (38 registros)
- CountryID (PK)
- Country

---

### Tabelas de Análise

#### `rfm` (4.373 registros)
Segmentação de clientes por:
- Recency: dias desde última compra
- Frequency: número de compras
- Monetary: total gasto (£)

#### `metrics`
KPIs pré-calculados:
- Gross Sales
- Net Sales
- Average Order Value
- Cancellation Rate

---

## Pipeline ETL

### Bronze (Dados Brutos)
- Input: Dataset do Kaggle (CSV)
- Output: Parquet
- Registros: 541.909

### Silver (Dados Limpos)
- Input: Bronze
- Transformações:
  - Remove duplicatas (-2.636 registros)
  - Trata valores nulos
  - Padroniza tipos de dados
  - Normaliza datas
- Output: 539.273 registros

### Gold (Pronto para Análise)
- Input: Silver
- Transformações:
  - Cria star schema
  - Constrói dimensões
  - Calcula RFM
  - Gera métricas
- Output: Parquet + JSON (para Streamlit)

---

## 🛠️ Ferramentas Usadas

**Processamento de Dados**
- Python 3.11
- Pandas
- NumPy
- Parquet

**Dashboard**
- Streamlit
- Plotly
- Pandas

**Infraestrutura**
- GitHub + Git LFS
- Streamlit Cloud
- Jupyter Notebooks

---

## 📁 Estrutura do Projeto

```
uk-retail-analysis/
├── app.py                              # Dashboard Streamlit
├── requirements.txt
├── README.md
│
├── src/scripts/
│   ├── 01_bronze_layer.ipynb
│   ├── 02_silver_layer.ipynb
│   ├── 03_gold_layer.ipynb
│   ├── 04_load_database.ipynb
│   ├── 05_SQL_queries.ipynb
│   ├── 06_quality_report.ipynb
│   │
│   └── data/
│       ├── bronze/
│       ├── silver/
│       ├── gold/                      # Parquet
│       │   ├── fact_all.parquet
│       │   ├── dim_customer.parquet
│       │   ├── dim_product.parquet
│       │   ├── dim_date.parquet
│       │   └── dim_country.parquet
│       │
│       └── json/                      # Para Streamlit
│           ├── fact_all.json
│           ├── dim_customer.json
│           ├── dim_product.json
│           ├── dim_date.json
│           ├── dim_country.json
│           ├── rfm.json
│           └── metrics.json
│
├── dags_airflow/
├── .gitattributes
├── .gitignore
└── to_json.py
```

---

## Como Usar

### Pré-requisitos
- Python 3.11+
- Git com Git LFS

### Instalação

1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/uk-retail-analysis.git
cd uk-retail-analysis
```

2. Instale as dependências
```bash
pip install -r requirements.txt
```

3. Execute o pipeline (opcional)
```bash
jupyter nbconvert --to notebook --execute src/scripts/01_bronze_layer.ipynb
jupyter nbconvert --to notebook --execute src/scripts/02_silver_layer.ipynb
jupyter nbconvert --to notebook --execute src/scripts/03_gold_layer.ipynb
```

4. Inicie o dashboard
```bash
streamlit run app.py
```

5. Abra no navegador
```
http://localhost:8501
```

---

## 📊 O que tem no Dashboard

### Aba Overview
- KPIs: Vendas Brutas, Vendas Líquidas, Total de Pedidos, Clientes
- Gráfico de vendas mensais
- Breakdown de tipos de transação
- Top 10 países por vendas

### Aba Clientes
- Métricas RFM
- Scatter plot Frequência vs Monetário
- Top 20 clientes por valor
- Análise de segmentação

### Aba Produtos
- Estatísticas gerais
- Top 20 produtos por unidades vendidas
- Performance por produto

### Aba Transações
- Resumo de transações
- Filtro por tipo
- Tabela com histórico completo
- Busca e paginação

### Filtros Globais
- Filtro por ano
- Filtro por país
- Todos os gráficos atualizam em tempo real

---

## 📈 Insights dos Dados

### Geografia
- Reino Unido lidera com 79% das vendas
- Top 5: UK, Holanda, Irlanda, Alemanha, França
- 38 países no total

### Clientes
- Recência média: 30 dias
- Frequência média: 4,5 compras
- Valor médio por cliente: £2.090
- Maior cliente: £280.000 em vendas

### Produtos
- Produto mais vendido: WHITE HANGING HEART T-LIGHT HOLDER
- Preço médio: £4,50
- Faixa de preço: £0,01 a £649,50
- Categoria top: Home & Garden

### Vendas
- Pico: Novembro 2011 (época de festas)
- Vale: Janeiro 2010
- Ticket médio: £436
- Taxa de cancelamento: 1,7%

---

## Limpeza de Dados

O que foi feito:
- Removidas 2.636 duplicatas
- Tratamento de valores nulos
- Padronização de tipos
- Normalização de datas
- Validação de valores

Verificações:
- ✅ Integridade referencial
- ✅ Sem registros órfãos
- ✅ Datas validadas (2010-2011)
- ✅ Valores positivos
- ✅ Cobertura completa

---

## 🔗 Links

- **Dataset Original:** [Kaggle - Online Retail Dataset](https://www.kaggle.com/datasets/lakshmi25npathi/online-retail-dataset)


**Última atualização:** Abril 2026
