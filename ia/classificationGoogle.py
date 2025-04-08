from icrawler.builtin import GoogleImageCrawler
import tensorflow as tf
import numpy as np
from PIL import Image
import os
from utils.preprocess import preprocess_image

# ======= Parâmetro de busca fixo =======
fase_desejada = "soja fase vegetativa" 
imagem_destino = "google_soja.jpg"

# ======= Buscar imagem do Google =======
print(f"🔍 Buscando imagem para: '{fase_desejada}'")

crawler = GoogleImageCrawler(storage={'root_dir': '.'})
crawler.crawl(keyword=fase_desejada, max_num=1, file_idx_offset=0)

# Renomear a imagem para facilitar
for file in os.listdir('.'):
    if file.endswith(('.jpg', '.jpeg', '.png')) and '000001' in file:
        os.rename(file, imagem_destino)
        break

# ======= Carregar modelo =======
model = tf.keras.models.load_model("model/model_soja.h5")

# Labels
growth_phases = ['Germinativa', 'Vegetativa', 'Reprodutiva', 'Maturacao']  # sem acento

# ======= Carregar e classificar imagem =======
try:
    with open(imagem_destino, 'rb') as img_file:
        img_bytes = img_file.read()
    
    img = preprocess_image(img_bytes)
    prediction = model.predict(img)
    predicted_label = growth_phases[np.argmax(prediction)]

    print(f"🌱 Fase detectada: **{predicted_label}**")

except Exception as e:
    print(f"[x] Erro ao processar imagem: {str(e)}")

# (Opcional) Remover imagem baixada
# os.remove(imagem_destino)
