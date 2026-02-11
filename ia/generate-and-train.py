"""
Script para gerar um dataset fake e treinar o modelo de classificação de fases de soja
"""
import os
import numpy as np
from PIL import Image, ImageDraw
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

# Configurações
IMG_SIZE = (224, 224)
BATCH_SIZE = 16
EPOCHS = 5
GROWTH_PHASES = ["VE", "VC", "V1", "V2", "V3", "Vn", "R1", "R2", "R3", "R4", "R5", "R6", "R7", "R8"]
IMAGES_PER_CLASS = 20  # 20 imagens por fase (280 total)

base_dir = os.path.dirname(os.path.abspath(__file__))
dataset_dir = os.path.join(base_dir, "datasets", "soja")
models_dir = os.path.join(base_dir, "models")

print("=" * 60)
print("🌱 Gerando dataset fake para treinamento...")
print("=" * 60)

# Criar pastas de dataset
os.makedirs(dataset_dir, exist_ok=True)
os.makedirs(models_dir, exist_ok=True)

# Gerar imagens fake para cada fase
for phase in GROWTH_PHASES:
    phase_dir = os.path.join(dataset_dir, phase)
    os.makedirs(phase_dir, exist_ok=True)
    
    for i in range(IMAGES_PER_CLASS):
        # Criar imagem aleatória (simulando foto de planta)
        img = Image.new('RGB', IMG_SIZE, color=(50, 100, 50))  # Verde base
        draw = ImageDraw.Draw(img)
        
        # Adicionar "detalhes" aleatórios
        for _ in range(20):
            x = np.random.randint(0, IMG_SIZE[0])
            y = np.random.randint(0, IMG_SIZE[1])
            size = np.random.randint(5, 30)
            color = tuple(np.random.randint(0, 255, 3))
            draw.ellipse([x, y, x+size, y+size], fill=color)
        
        # Salvar imagem
        img_path = os.path.join(phase_dir, f"{phase}_{i:03d}.jpg")
        img.save(img_path)
    
    print(f"✅ {IMAGES_PER_CLASS} imagens geradas para fase: {phase}")

print("\n" + "=" * 60)
print("🤖 Treinando modelo...")
print("=" * 60)

# Geradores de dados
datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2,
    rotation_range=15,
    zoom_range=0.2,
    horizontal_flip=True
)

train_gen = datagen.flow_from_directory(
    dataset_dir,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    subset="training"
)

val_gen = datagen.flow_from_directory(
    dataset_dir,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    subset="validation"
)

# Construir modelo
model = Sequential([
    Conv2D(32, (3, 3), activation='relu', input_shape=(224, 224, 3)),
    MaxPooling2D(2, 2),
    Conv2D(64, (3, 3), activation='relu'),
    MaxPooling2D(2, 2),
    Conv2D(128, (3, 3), activation='relu'),
    MaxPooling2D(2, 2),
    Flatten(),
    Dense(128, activation='relu'),
    Dropout(0.5),
    Dense(len(GROWTH_PHASES), activation='softmax')
])

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# Callbacks
callbacks = [
    EarlyStopping(patience=3, restore_best_weights=True),
    ModelCheckpoint(os.path.join(models_dir, "model_soja.h5"), save_best_only=True)
]

# Treinar
history = model.fit(
    train_gen,
    epochs=EPOCHS,
    validation_data=val_gen,
    callbacks=callbacks,
    verbose=1
)

print("\n" + "=" * 60)
print(f"✅ Modelo treinado e salvo em: {os.path.join(models_dir, 'model_soja.h5')}")
print("=" * 60)
print("\nAgora você pode:")
print("1. Desativar o Mock Mode no .env (USE_MOCK_CLASSIFIER=false)")
print("2. Reiniciar o backend")
print("3. Testar a análise no frontend")
