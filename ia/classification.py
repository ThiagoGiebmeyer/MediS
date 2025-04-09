import argparse
from pymongo import MongoClient
from bson import ObjectId
import tensorflow as tf
import numpy as np
import base64
from utils.preprocess import preprocess_image

# Argumentos de linha de comando
parser = argparse.ArgumentParser(description="Classificar imagens de plantas no MongoDB.")
parser.add_argument("--reprocess", action="store_true", help="Força reprocessamento de imagens já classificadas.")
args = parser.parse_args()

client = MongoClient("mongodb://localhost:27017/MediS")
db = client["plant_monitor"]
collection = db["plant_images"]

model = tf.keras.models.load_model("models/model_soja.h5")

growth_phases = [
    "VE", "VC", "V1", "V2", "V3", "Vn",
    "R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"
]

query = {} if args.reprocess else {"classification": {"$exists": False}}
documents = collection.find(query)

for doc in documents:
    try:
        image_data = doc.get("image_data")
        if not image_data:
            raise ValueError("Campo image_data está ausente.")

        img_bytes = base64.b64decode(image_data) if isinstance(image_data, str) else image_data

        img = preprocess_image(img_bytes)
        if img is None:
            raise ValueError("Imagem inválida para classificação.")

        prediction = model.predict(img)
        predicted_label = growth_phases[np.argmax(prediction)]

        collection.update_one(
            {"_id": ObjectId(doc["_id"])},
            {"$set": {"classification": predicted_label}}
        )

        print(f"[✔] {doc['_id']} classificada como {predicted_label}")

    except Exception as e:
        print(f"[x] Erro ao classificar {doc.get('_id')}: {str(e)}")
