from pymongo import MongoClient
from bson import ObjectId
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import base64
from utils.preprocess import preprocess_image

# Conectar ao banco
client = MongoClient("mongodb://localhost:27017/")
db = client["plant_monitor"]
collection = db["plant_images"]

# Carregar modelo treinado
model = tf.keras.models.load_model("model/model_soja.h5")

# Labels
growth_phases = ['Germinativa', 'Vegetativa', 'Reprodutiva', 'Maturação']

# Buscar documentos e classificar
documents = collection.find()

for doc in documents:
    try:
        # Decode base64 ou binário
        if isinstance(doc["image_data"], str):
            img_bytes = base64.b64decode(doc["image_data"])
        else:
            img_bytes = doc["image_data"]

        img = preprocess_image(img_bytes)
        prediction = model.predict(img)
        predicted_label = growth_phases[np.argmax(prediction)]

        collection.update_one(
            {"_id": ObjectId(doc["_id"])},
            {"$set": {"classification": predicted_label}}
        )

        print(f"[✔] {_id} classificada como {predicted_label}")

    except Exception as e:
        print(f"[x] Erro ao classificar: {str(e)}")
