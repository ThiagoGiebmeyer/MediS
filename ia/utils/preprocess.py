from PIL import Image
import numpy as np
import io

def preprocess_image(img_bytes, target_size=(224, 224)):
    image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    image = image.resize(target_size)
    image_array = np.array(image) / 255.0
    image_array = np.expand_dims(image_array, axis=0)  # [1, 224, 224, 3]
    return image_array
