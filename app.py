import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from pathlib import Path

# Page config 
st.set_page_config(
    page_title="Retail Analytics",
    page_icon="🛒",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS 
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap');

:root {
    --bg: #0a0a0f;
    --surface: #12121a;
    --surface2: #1a1a26;
    --border: #2a2a3d;
    --accent: #7c6af7;
    --accent2: #f7c26a;
    --accent3: #6af7c2;
    --text: #e8e8f0;
    --muted: #7a7a9a;
}

html, body, [data-testid="stAppViewContainer"] {
    background-color: var(--bg) !important;
    color: var(--text) !important;
    font-family: 'DM Sans', sans-serif !important;
}

[data-testid="stSidebar"] {
    background-color: var(--surface) !important;
    border-right: 1px solid var(--border) !important;
}

[data-testid="stSidebar"] * { color: var(--text) !important; }

h1, h2, h3 { font-family: 'Space Mono', monospace !important; }

/* Metric cards */
[data-testid="metric-container"] {
    background: var(--surface2) !important;
    border: 1px solid var(--border) !important;
    border-radius: 12px !important;
    padding: 20px !important;
}
[data-testid="metric-container"] label {
    color: var(--muted) !important;
    font-size: 11px !important;
    letter-spacing: 2px !important;
    text-transform: uppercase !important;
    font-family: 'Space Mono', monospace !important;
}
[data-testid="metric-container"] [data-testid="stMetricValue"] {
    color: var(--accent) !important;
    font-family: 'Space Mono', monospace !important;
    font-size: 1.8rem !important;
}

/* Tabs */
[data-testid="stTabs"] button {
    font-family: 'Space Mono', monospace !important;
    font-size: 12px !important;
    letter-spacing: 1px !important;
    color: var(--muted) !important;
    background: transparent !important;
    border: none !important;
}
[data-testid="stTabs"] button[aria-selected="true"] {
    color: var(--accent) !important;
    border-bottom: 2px solid var(--accent) !important;
}

/* Selectbox / widgets */
[data-testid="stSelectbox"] > div > div {
    background: var(--surface2) !important;
    border: 1px solid var(--border) !important;
    color: var(--text) !important;
}

div.stMarkdown p { color: var(--muted) !important; }

.section-title {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #7c6af7;
    margin-bottom: 8px;
    border-left: 3px solid #7c6af7;
    padding-left: 10px;
}

.kpi-row { display: flex; gap: 16px; }

footer { visibility: hidden; }
#MainMenu { visibility: hidden; }
</style>
""", unsafe_allow_html=True)

# Load data 
@st.cache_data
def load_data():
    base = "src/scripts/data/json/"
    fact       = pd.read_json(base + "fact_all.json", orient="records")
    dim_date   = pd.read_json(base + "dim_date.json", orient="records")
    dim_country= pd.read_json(base + "dim_country.json", orient="records")
    dim_product= pd.read_json(base + "dim_product.json", orient="records")
    dim_customer=pd.read_json(base + "dim_customer.json", orient="records")
    metrics    = pd.read_json(base + "metrics.json", orient="records")
    products   = pd.read_json(base + "most_purchased_products.json", orient="records")
    rfm        = pd.read_json(base + "rfm.json", orient="records")

    # Enrich fact
    fact = fact.merge(dim_date, on="DateID", how="left")
    fact = fact.merge(dim_country, on="CountryID", how="left")
    fact = fact.merge(dim_product, on="StockCode", how="left")

    return fact, dim_date, dim_country, dim_product, dim_customer, metrics, products, rfm

fact, dim_date, dim_country, dim_product, dim_customer, metrics, products, rfm = load_data()

# Plotly dark theme 
PLOTLY_LAYOUT = dict(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font=dict(family="DM Sans", color="#e8e8f0", size=12),
    xaxis=dict(gridcolor="#2a2a3d", zerolinecolor="#2a2a3d"),
    yaxis=dict(gridcolor="#2a2a3d", zerolinecolor="#2a2a3d"),
    margin=dict(l=10, r=10, t=30, b=10),
    colorway=["#7c6af7","#f7c26a","#6af7c2","#f76a8a","#6aabf7","#c26af7"],
)

COLORS = ["#7c6af7","#f7c26a","#6af7c2","#f76a8a","#6aabf7","#c26af7","#f7a06a","#a0f76a"]

# Sidebar 
with st.sidebar:
    st.markdown("## 🛒 UK Retail")
    st.markdown("---")

    years = sorted(fact["Year"].dropna().unique().astype(int).tolist())
    selected_year = st.selectbox("Ano", ["Todos"] + years)

    countries = sorted(dim_country["Country"].tolist())
    selected_country = st.selectbox("País", ["Todos"] + countries)

    st.markdown("---")
    st.markdown(f"<small style='color:#7a7a9a'>**{len(fact):,}** transações carregadas</small>", unsafe_allow_html=True)

# Filter
filtered = fact.copy()
if selected_year != "Todos":
    filtered = filtered[filtered["Year"] == int(selected_year)]
if selected_country != "Todos":
    filtered = filtered[filtered["Country"] == selected_country]

sales = filtered[filtered["TransactionType"] == "Sale"]

# Header
st.markdown("<h1 style='margin-bottom:4px'>UK Retail Analytics</h1>", unsafe_allow_html=True)
st.markdown("<p style='color:#7a7a9a;font-size:13px;margin-top:0'>E-commerce Performance & Customer Insights</p>", unsafe_allow_html=True)

# Tabs 
tab1, tab2, tab3, tab4 = st.tabs(["OVERVIEW", "CLIENTES", "PRODUTOS", "TRANSAÇÕES"])


# TAB 1 – OVERVIEW

with tab1:
    # KPIs — calculados dinamicamente a partir dos filtros
    gross_sales   = filtered["total_value"].clip(lower=0).sum()
    net_sales     = sales["total_value"].sum()
    total_orders  = sales["InvoiceNo"].nunique()
    distinct_cust = filtered["CustomerID"].nunique()
    distinct_prod = filtered["StockCode"].nunique()
    units_sold    = sales["Quantity"].clip(lower=0).sum()
    avg_order     = net_sales / total_orders if total_orders else 0
    cancel_rate   = len(filtered[filtered["TransactionType"] == "Cancellation"]) / len(filtered) * 100 if len(filtered) else 0

    k1, k2, k3, k4 = st.columns(4)
    k1.metric("💰 Gross Sales",      f"£{gross_sales/1e6:.2f}M")
    k2.metric("📈 Net Sales",        f"£{net_sales/1e6:.2f}M")
    k3.metric("🧾 Total Orders",     f"{int(total_orders):,}")
    k4.metric("👤 Clientes Únicos",  f"{int(distinct_cust):,}")

    st.markdown("<br>", unsafe_allow_html=True)
    k5, k6, k7, k8 = st.columns(4)
    k5.metric("📦 Produtos Únicos",   f"{int(distinct_prod):,}")
    k6.metric("🏷️ Unidades Vendidas", f"{units_sold/1e6:.2f}M" if units_sold >= 1e6 else f"{int(units_sold):,}")
    k7.metric("🛒 Ticket Médio",      f"£{avg_order:.2f}")
    k8.metric("❌ Taxa Cancelamento", f"{cancel_rate:.1f}%")

    st.markdown("<br>", unsafe_allow_html=True)

    col_l, col_r = st.columns([3, 2])

    with col_l:
        st.markdown("<div class='section-title'>VENDAS MENSAIS</div>", unsafe_allow_html=True)
        monthly = (
            sales.groupby(["Year", "Month"])["total_value"]
            .sum().reset_index()
        )
        monthly["Period"] = pd.to_datetime(monthly[["Year","Month"]].assign(Day=1))
        monthly = monthly.sort_values("Period")

        fig = go.Figure()
        fig.add_trace(go.Scatter(
            x=monthly["Period"], y=monthly["total_value"],
            mode="lines+markers",
            line=dict(color="#7c6af7", width=2.5),
            marker=dict(size=6, color="#7c6af7"),
            fill="tozeroy",
            fillcolor="rgba(124,106,247,0.12)",
            name="Vendas",
        ))
        fig.update_layout(**PLOTLY_LAYOUT, height=300)
        fig.update_yaxes(tickprefix="£", tickformat=".2s")
        st.plotly_chart(fig, use_container_width=True)

    with col_r:
        st.markdown("<div class='section-title'>TIPO DE TRANSAÇÃO</div>", unsafe_allow_html=True)
        tx_counts = filtered["TransactionType"].value_counts().reset_index()
        tx_counts.columns = ["Tipo", "Count"]
        fig2 = px.pie(tx_counts, names="Tipo", values="Count",
                      color_discrete_sequence=COLORS, hole=0.55)
        fig2.update_layout(**PLOTLY_LAYOUT, height=300,
                           legend=dict(orientation="h", y=-0.15))
        fig2.update_traces(textposition="inside", textinfo="percent+label")
        st.plotly_chart(fig2, use_container_width=True)

    st.markdown("<div class='section-title'>TOP 10 PAÍSES POR VENDAS</div>", unsafe_allow_html=True)
    country_sales = (
        sales.groupby("Country")["total_value"].sum()
        .sort_values(ascending=True).tail(10).reset_index()
    )
    fig3 = px.bar(country_sales, x="total_value", y="Country",
                  orientation="h", color="total_value",
                  color_continuous_scale=["#2a2a3d","#7c6af7"])
    fig3.update_layout(**PLOTLY_LAYOUT, height=350,
                       coloraxis_showscale=False)
    fig3.update_xaxes(tickprefix="£", tickformat=".2s")
    st.plotly_chart(fig3, use_container_width=True)

# TAB 2 – CLIENTES (RFM)

with tab2:
    st.markdown("### Análise RFM de Clientes")
    st.markdown("<p style='color:#7a7a9a;font-size:13px'>Recency · Frequency · Monetary — segmentação da base de clientes</p>", unsafe_allow_html=True)

    c1, c2, c3 = st.columns(3)
    c1.metric("⏱ Recência Média",  f"{rfm['Recency'].mean():.0f} dias")
    c2.metric("🔁 Frequência Média",f"{rfm['Frequency'].mean():.1f} pedidos")
    c3.metric("💵 Monetário Médio", f"£{rfm['Monetary'].mean():,.0f}")

    st.markdown("<br>", unsafe_allow_html=True)

    # RFM Scatter
    st.markdown("<div class='section-title'>FREQUÊNCIA × MONETÁRIO (tamanho = recência inversa)</div>", unsafe_allow_html=True)
    rfm_plot = rfm.copy()
    rfm_plot = rfm_plot[rfm_plot["Monetary"] < rfm_plot["Monetary"].quantile(0.97)]
    rfm_plot = rfm_plot[rfm_plot["Frequency"] < rfm_plot["Frequency"].quantile(0.97)]
    rfm_plot["RecencyInv"] = rfm_plot["Recency"].max() - rfm_plot["Recency"] + 1

    fig4 = px.scatter(
        rfm_plot, x="Frequency", y="Monetary",
        size="RecencyInv", size_max=25,
        color="Recency",
        color_continuous_scale=["#6af7c2","#7c6af7","#f76a8a"],
        hover_data=["CustomerID","Recency","Frequency","Monetary"],
        labels={"Frequency":"Frequência (pedidos)","Monetary":"Valor Total (£)"},
    )
    fig4.update_layout(**PLOTLY_LAYOUT, height=420,
                       coloraxis_colorbar=dict(title="Recência"))
    st.plotly_chart(fig4, use_container_width=True)

    col_a, col_b = st.columns(2)
    with col_a:
        st.markdown("<div class='section-title'>DISTRIBUIÇÃO DE RECÊNCIA</div>", unsafe_allow_html=True)
        fig5 = px.histogram(rfm, x="Recency", nbins=40,
                            color_discrete_sequence=["#7c6af7"])
        fig5.update_layout(**PLOTLY_LAYOUT, height=280)
        fig5.update_xaxes(title="Dias desde última compra")
        st.plotly_chart(fig5, use_container_width=True)

    with col_b:
        st.markdown("<div class='section-title'>TOP 10 CLIENTES POR VALOR</div>", unsafe_allow_html=True)
        top_cust = rfm.nlargest(10, "Monetary")[["CustomerID","Monetary","Frequency","Recency"]]
        top_cust["Monetary"] = top_cust["Monetary"].apply(lambda x: f"£{x:,.0f}")
        st.dataframe(top_cust, use_container_width=True, hide_index=True)

# TAB 3 – PRODUTOS

with tab3:
    st.markdown("### Análise de Produtos")

    col_p1, col_p2 = st.columns(2)

    with col_p1:
        st.markdown("<div class='section-title'>TOP 10 PRODUTOS POR UNIDADES VENDIDAS</div>", unsafe_allow_html=True)
        top_prod = (
            products.groupby("StockCode")["UnitsSold"].sum()
            .sort_values(ascending=False).head(10).reset_index()
        )
        top_prod = top_prod.merge(dim_product, on="StockCode", how="left")
        top_prod["Label"] = top_prod["ProductDescription"].str[:30]

        fig6 = px.bar(
            top_prod.sort_values("UnitsSold"),
            x="UnitsSold", y="Label", orientation="h",
            color="UnitsSold",
            color_continuous_scale=["#2a2a3d","#f7c26a"],
        )
        fig6.update_layout(**PLOTLY_LAYOUT, height=380, coloraxis_showscale=False)
        st.plotly_chart(fig6, use_container_width=True)

    with col_p2:
        st.markdown("<div class='section-title'>TOP 10 PRODUTOS POR RECEITA</div>", unsafe_allow_html=True)
        top_rev = (
            sales.groupby(["StockCode","ProductDescription"])["total_value"]
            .sum().sort_values(ascending=False).head(10).reset_index()
        )
        top_rev["Label"] = top_rev["ProductDescription"].str[:30]

        fig7 = px.bar(
            top_rev.sort_values("total_value"),
            x="total_value", y="Label", orientation="h",
            color="total_value",
            color_continuous_scale=["#2a2a3d","#6af7c2"],
        )
        fig7.update_layout(**PLOTLY_LAYOUT, height=380, coloraxis_showscale=False)
        fig7.update_xaxes(tickprefix="£", tickformat=".2s")
        st.plotly_chart(fig7, use_container_width=True)

    st.markdown("<div class='section-title'>RECEITA POR CATEGORIA (StockCode PREFIX)</div>", unsafe_allow_html=True)
    sales2 = sales.copy()
    sales2["Prefix"] = sales2["StockCode"].str[:2]
    prefix_rev = sales2.groupby("Prefix")["total_value"].sum().sort_values(ascending=False).head(15).reset_index()
    fig8 = px.treemap(prefix_rev, path=["Prefix"], values="total_value",
                      color="total_value",
                      color_continuous_scale=["#1a1a26","#7c6af7"])
    fig8.update_layout(**PLOTLY_LAYOUT, height=320, coloraxis_showscale=False)
    st.plotly_chart(fig8, use_container_width=True)

# TAB 4 – TRANSAÇÕES

with tab4:
    st.markdown("### Análise de Transações")

    col_t1, col_t2 = st.columns(2)

    with col_t1:
        st.markdown("<div class='section-title'>VENDAS POR DIA DA SEMANA</div>", unsafe_allow_html=True)
        dow_order = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
        dow = sales.groupby("Weekday")["total_value"].sum().reindex(dow_order).reset_index()
        fig9 = px.bar(dow, x="Weekday", y="total_value",
                      color="total_value",
                      color_continuous_scale=["#2a2a3d","#7c6af7"])
        fig9.update_layout(**PLOTLY_LAYOUT, height=300, coloraxis_showscale=False)
        fig9.update_yaxes(tickprefix="£", tickformat=".2s")
        st.plotly_chart(fig9, use_container_width=True)

    with col_t2:
        st.markdown("<div class='section-title'>VENDAS POR HORA DO DIA</div>", unsafe_allow_html=True)
        hour_sales = sales.groupby("Hour")["total_value"].sum().reset_index()
        fig10 = px.area(hour_sales, x="Hour", y="total_value",
                        color_discrete_sequence=["#f7c26a"])
        fig10.update_traces(fillcolor="rgba(247,194,106,0.15)", line_width=2)
        fig10.update_layout(**PLOTLY_LAYOUT, height=300)
        fig10.update_yaxes(tickprefix="£", tickformat=".2s")
        st.plotly_chart(fig10, use_container_width=True)

    st.markdown("<div class='section-title'>VALOR MÉDIO DO PEDIDO POR PAÍS (TOP 15)</div>", unsafe_allow_html=True)
    aov_country = (
        sales.groupby("Country").agg(
            Total=("total_value","sum"),
            Orders=("InvoiceNo","nunique")
        ).reset_index()
    )
    aov_country["AOV"] = aov_country["Total"] / aov_country["Orders"]
    aov_country = aov_country.nlargest(15, "AOV")

    fig11 = px.scatter(
        aov_country, x="Orders", y="AOV", size="Total",
        color="AOV", text="Country",
        color_continuous_scale=["#6aabf7","#7c6af7","#f7c26a"],
        size_max=50,
    )
    fig11.update_traces(textposition="top center", textfont_size=10)
    fig11.update_layout(**PLOTLY_LAYOUT, height=380, coloraxis_showscale=False)
    fig11.update_yaxes(tickprefix="£", tickformat=".0f")
    st.plotly_chart(fig11, use_container_width=True)

    st.markdown("<div class='section-title'>AMOSTRA DE TRANSAÇÕES RECENTES</div>", unsafe_allow_html=True)
    sample = (
        filtered.sort_values("InvoiceDate", ascending=False)
        [["InvoiceDate","InvoiceNo","ProductDescription","Country","Quantity","UnitPrice","total_value","TransactionType"]]
        .head(200)
    )
    sample["total_value"] = sample["total_value"].apply(lambda x: f"£{x:,.2f}")
    sample["UnitPrice"]   = sample["UnitPrice"].apply(lambda x: f"£{x:,.2f}")
    st.dataframe(sample, use_container_width=True, hide_index=True)