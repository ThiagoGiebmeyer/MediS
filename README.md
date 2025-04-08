# 🌱 Classificação de Fases da Soja com Visão Computacional e IA

Projeto de TCC que utiliza uma rede neural treinada para classificar imagens de plantas de soja nas seguintes fases de crescimento:

- **Germinativa**
- **Vegetativa**
- **Reprodutiva**
- **Maturação**

A aplicação envolve coleta de dados via **ESP32-CAM**, armazenamento no **MongoDB**, e classificação automática com **IA em Python**.

---

## 🚀 Como rodar o projeto

### 1️⃣ Clone o repositório

```bash
git clone https://github.com/ThiagoGiebmeyer/MediS.git
cd MediS
```

### 2️⃣ Instale as dependências

Certifique-se de ter o **Python 3.8+** instalado. Em seguida, execute:

```bash
pip install -r requirements.txt
```

> **Nota:** Certifique-se de que você tem o **TensorFlow 2.x** e o **icrawler** instalados.

---

## 🧠 Treinar o modelo com imagens locais

1. Coloque as imagens separadas por fase nas pastas em `ia/datasets/Soja/`.
2. Execute o script de treinamento:

```bash
python ia/treinee.py
```

O modelo treinado será salvo em: `ia/model/model_soja.h5`.

---

## 🔍 Classificar imagem do Google

O script baixa uma imagem automaticamente do Google com base na fase desejada e faz a predição. Para utilizá-lo, execute:

```bash
python ia/classificationGoogle.py
```

> **Nota:** Você pode alterar a fase pesquisada diretamente no código, modificando a variável `fase_desejada`.

---

## 🌐 Classificação automática via banco de dados (MongoDB)

Se quiser classificar imagens armazenadas em um banco **MongoDB** (em base64 ou binário), use o script correspondente. Ele carrega todas as imagens, as classifica e atualiza a coleção com a fase prevista.

---

## 🧪 Requisitos

Certifique-se de ter as seguintes dependências instaladas:

- **Python 3.8+**
- **TensorFlow 2.11+**
- **Pillow**
- **Numpy**
- **icrawler**
- **pymongo**

---

## 📌 Observações

As imagens para treinamento devem ter boa resolução (recomendado ≥ 800x600).

Os dados da ESP32-CAM podem ser integrados via API Node.js (ver `server/server.js`).

Ideal usar um dataset balanceado com 50+ imagens por fase.

---

## 📚 Licença

Uso educacional e acadêmico. Para outros fins, verifique as licenças das imagens utilizadas.

---

## 👨‍💻 Autor

Thiago — Engenharia de Software
