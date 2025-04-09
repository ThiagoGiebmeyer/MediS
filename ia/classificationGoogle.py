from icrawler.builtin import GoogleImageCrawler
import tensorflow as tf
import numpy as np
import os
from utils.preprocess import preprocess_image

fase_desejada = "SOJA NO ESTADO V3" 
imagem_destino = "google_soja.jpg"

if os.path.exists(imagem_destino):
    os.remove(imagem_destino)
    
print(f"🔍 Buscando imagem para: '{fase_desejada}'")
crawler = GoogleImageCrawler(storage={'root_dir': '.'})
crawler.crawl(keyword=fase_desejada, max_num=1, file_idx_offset=0)

for file in os.listdir('.'):
    if file.endswith(('.jpg', '.jpeg', '.png')) and '000001' in file:
        os.rename(file, imagem_destino)
        break

model = tf.keras.models.load_model("models/model_soja.h5")

growth_phases = [
    "VE", "VC", "V1", "V2", "V3", "Vn",
    "R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"
]

try:
    with open(imagem_destino, 'rb') as img_file:
        img_bytes = img_file.read()
    
    img = preprocess_image(img_bytes)
    prediction = model.predict(img)
    predicted_label = growth_phases[np.argmax(prediction)]

    print(f"🌱 Fase detectada: **{predicted_label}**")

except Exception as e:
    print(f"[x] Erro ao processar imagem: {str(e)}")

# Remover imagem baixada
# os.remove(imagem_destino)
