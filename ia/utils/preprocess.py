from PIL import Image
import numpy as np
import io
import cv2

def calculate_entropy(cv2_image):
    """Calcula a entropia da imagem (nível de detalhes)."""
    gray = cv2.cvtColor(cv2_image, cv2.COLOR_RGB2GRAY)
    hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
    hist_norm = hist.ravel() / hist.sum()
    hist_norm = hist_norm[hist_norm > 0]
    return -np.sum(hist_norm * np.log2(hist_norm))

def preprocess_image(img_bytes, target_size=(224, 224), min_width=100, min_height=100, min_entropy=3.5):
    try:
        # Abre a imagem a partir dos bytes e converte para RGB
        image = Image.open(io.BytesIO(img_bytes)).convert("RGB")

        # Verifica se a imagem tem tamanho mínimo aceitável
        if image.width < min_width or image.height < min_height:
            raise ValueError("Imagem muito pequena")

        # Converte para array NumPy (formato OpenCV) para verificar entropia
        cv2_image = np.array(image)
        entropy = calculate_entropy(cv2_image)

        # Verifica se a imagem tem entropia suficiente (detalhamento mínimo)
        if entropy < min_entropy:
            raise ValueError(f"Imagem com baixa entropia: {entropy:.2f}")

        # Redimensiona a imagem para o tamanho desejado e normaliza os pixels
        image = image.resize(target_size)
        image_array = np.array(image) / 255.0

        # Adiciona dimensão extra para representar o batch [1, H, W, 3]
        image_array = np.expand_dims(image_array, axis=0)

        return image_array

    except Exception as e:
        print(f"⚠️ Erro no pré-processamento: {e}")
        return None
