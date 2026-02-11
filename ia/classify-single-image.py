import os
import sys
import tensorflow as tf
import numpy as np
from utils.preprocess import preprocess_image

base_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(base_dir, "models", "model_soja.h5")

model = tf.keras.models.load_model(model_path)
growth_phases = ["VE", "VC", "V1", "V2", "V3", "Vn", "R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"]

def main():
    image_path = sys.argv[1]
    
    with open(image_path, "rb") as f:
        img_bytes = f.read()

    img = preprocess_image(img_bytes)
    prediction = model.predict(img)
    predicted_label = growth_phases[np.argmax(prediction)]

    print(predicted_label)

if __name__ == "__main__":
    main()
