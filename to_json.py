import pandas as pd
import os

# Pasta com os arquivos Parquet
pasta_entrada = "src\\scripts\\data\\gold"
pasta_saida = "dashboard\\data"

# Cria a pasta de saída se não existir
os.makedirs(pasta_saida, exist_ok=True)

# Loop por todos os arquivos .parquet
for arquivo in os.listdir(pasta_entrada):
    if arquivo.endswith(".parquet"):
        caminho_parquet = os.path.join(pasta_entrada, arquivo)
        nome_sem_extensao = os.path.splitext(arquivo)[0]
        caminho_json = os.path.join(pasta_saida, f"{nome_sem_extensao}.json")

        df = pd.read_parquet(caminho_parquet)
        df.to_json(caminho_json, orient="records", indent=2)

        print(f"Convertido: {arquivo} → {nome_sem_extensao}.json")

print("Todos os arquivos convertidos!")