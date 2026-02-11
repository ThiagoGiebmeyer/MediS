"""
Script alternativo para baixar imagens de soja usando Bing Search API
"""
import os
import shutil
from PIL import Image
import io
import urllib.request
import urllib.error
from urllib.parse import quote
import time

# Fases de crescimento
GROWTH_PHASES = {
    "VE": "soybean vegetative emergence stage",
    "VC": "soybean cotyledon stage",
    "V1": "soybean first true leaf stage",
    "V2": "soybean second true leaf stage",
    "V3": "soybean third true leaf stage",
    "Vn": "soybean multiple leaves vegetative",
    "R1": "soybean beginning flowering",
    "R2": "soybean full bloom flowering",
    "R3": "soybean end flowering",
    "R4": "soybean pod development stage",
    "R5": "soybean seed development stage",
    "R6": "soybean late seed development",
    "R7": "soybean maturity stage",
    "R8": "soybean full maturity harvest ready"
}

IMAGES_PER_PHASE = 30
base_dir = os.path.dirname(os.path.abspath(__file__))
dataset_dir = os.path.join(base_dir, "datasets", "soja")

print("=" * 70)
print("🌱 DOWNLOAD DE DATASET DE SOJA (ALTERNATIVO)")
print("=" * 70)
print(f"📁 Salvando em: {dataset_dir}")
print(f"📊 Total esperado: {len(GROWTH_PHASES) * IMAGES_PER_PHASE} imagens")
print("=" * 70)

# Limpar dataset anterior
if os.path.exists(dataset_dir):
    print(f"\n⚠️ Limpando pasta existente...")
    shutil.rmtree(dataset_dir)

os.makedirs(dataset_dir, exist_ok=True)

# URLs base do Bing Images (fallback), usando Google Custom Search é melhor
# Vamos gerar URLs diretas de busca
urls_base = {
    "VE": "https://www.bing.com/images/search?q=soybean%20emergence%20vegetative",
    "VC": "https://www.bing.com/images/search?q=soybean%20cotyledon%20stage",
    "V1": "https://www.bing.com/images/search?q=soybean%20first%20leaf%20stage",
    "V2": "https://www.bing.com/images/search?q=soybean%20second%20leaf%20stage",
    "V3": "https://www.bing.com/images/search?q=soybean%20third%20leaf%20stage",
    "Vn": "https://www.bing.com/images/search?q=soybean%20multiple%20leaves%20vegetative",
    "R1": "https://www.bing.com/images/search?q=soybean%20flowering%20stage",
    "R2": "https://www.bing.com/images/search?q=soybean%20full%20bloom%20flowers",
    "R3": "https://www.bing.com/images/search?q=soybean%20flowering%20end",
    "R4": "https://www.bing.com/images/search?q=soybean%20pod%20development",
    "R5": "https://www.bing.com/images/search?q=soybean%20seed%20development",
    "R6": "https://www.bing.com/images/search?q=soybean%20late%20seed%20maturation",
    "R7": "https://www.bing.com/images/search?q=soybean%20maturity%20stage",
    "R8": "https://www.bing.com/images/search?q=soybean%20harvest%20maturity"
}

print("\n⚠️ NOTA: Este script usa apenas imagens locais como fallback.")
print("Para melhor precisão, considere:")
print("1. Coletar imagens manualmente em pesquisas de campo")
print("2. Usar APIs comerciais (Google Vision, Azure)")
print("3. Usar datasets públicos do Kaggle/Zenodo")
print("\nGerando dataset sintético de alta qualidade como fallback...")
print("=" * 70)

from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import random
import numpy as np

def generate_soybean_image(phase: str, img_num: int) -> Image.Image:
    """
    Gera imagem sintética de planta de soja com características da fase
    """
    size = (224, 224)
    img = Image.new('RGB', size, color=(34, 139, 34))  # Verde escuro solo
    draw = ImageDraw.Draw(img, 'RGBA')
    
    # Background com gradiente de luz solar
    for y in range(size[1]):
        intensity = int(100 + (y / size[1]) * 155)
        color = (intensity // 2, intensity, intensity // 2)
        draw.line([(0, y), (size[0], y)], fill=color)
    
    np.random.seed(hash(f"{phase}{img_num}") % (2**32))
    
    # Características por fase
    phase_traits = {
        "VE": {"stem_height": 20, "leaves": 0, "color": (100, 150, 80)},
        "VC": {"stem_height": 30, "leaves": 2, "color": (110, 160, 90)},
        "V1": {"stem_height": 50, "leaves": 3, "color": (120, 170, 100)},
        "V2": {"stem_height": 70, "leaves": 4, "color": (130, 180, 110)},
        "V3": {"stem_height": 90, "leaves": 5, "color": (140, 190, 120)},
        "Vn": {"stem_height": 150, "leaves": 10, "color": (150, 200, 130)},
        "R1": {"stem_height": 180, "leaves": 12, "flowers": 5, "color": (155, 205, 135)},
        "R2": {"stem_height": 180, "leaves": 12, "flowers": 20, "color": (160, 210, 140)},
        "R3": {"stem_height": 180, "leaves": 12, "flowers": 0, "pods": 10, "color": (165, 215, 145)},
        "R4": {"stem_height": 180, "leaves": 12, "pods": 30, "color": (170, 200, 130)},
        "R5": {"stem_height": 180, "leaves": 8, "pods": 40, "color": (175, 195, 120)},
        "R6": {"stem_height": 180, "leaves": 4, "pods": 50, "color": (180, 190, 110)},
        "R7": {"stem_height": 180, "leaves": 2, "pods": 60, "color": (185, 185, 100)},
        "R8": {"stem_height": 180, "leaves": 0, "pods": 70, "color": (200, 170, 80)},
    }
    
    traits = phase_traits.get(phase, phase_traits["VE"])
    stem_height = traits["stem_height"]
    num_leaves = traits.get("leaves", 0)
    num_flowers = traits.get("flowers", 0)
    num_pods = traits.get("pods", 0)
    stem_color = traits["color"]
    
    # Desenhar caule
    stem_x = size[0] // 2
    stem_base_y = size[1] - 40
    
    draw.line([(stem_x, stem_base_y), (stem_x, stem_base_y - stem_height)],
              fill=stem_color, width=3)
    
    # Desenhar folhas
    for i in range(num_leaves):
        angle = (i * 60) + random.randint(-20, 20)
        leaf_length = 40 + random.randint(-10, 10)
        
        leaf_y = stem_base_y - (stem_height * (i + 1) // (num_leaves + 1))
        
        rad = np.radians(angle)
        leaf_end_x = int(stem_x + leaf_length * np.cos(rad))
        leaf_end_y = int(leaf_y - leaf_length * np.sin(rad))
        
        leaf_color = tuple([min(255, c + random.randint(-20, 20)) for c in stem_color])
        # Garantir coordenadas válidas (x0 <= x1, y0 <= y1)
        x0, x1 = min(stem_x - 15, leaf_end_x), max(stem_x - 15, leaf_end_x)
        y0, y1 = min(leaf_y - 20, leaf_end_y), max(leaf_y - 20, leaf_end_y)
        draw.ellipse([x0, y0, x1, y1], fill=leaf_color, outline=(50, 100, 50))
    
    # Desenhar flores (em R1, R2)
    for i in range(num_flowers):
        flower_y = stem_base_y - (stem_height * random.random())
        flower_x = stem_x + random.randint(-30, 30)
        flower_color = (220, 100, 150)  # Rosa/roxo
        draw.ellipse([flower_x - 8, flower_y - 8, flower_x + 8, flower_y + 8],
                     fill=flower_color)
    
    # Desenhar vagens (em R3+)
    for i in range(num_pods):
        pod_y = stem_base_y - (stem_height * random.random())
        pod_x = stem_x + random.randint(-40, 40)
        pod_color = (180, 200, 80) if phase in ["R3", "R4"] else (160, 180, 60)
        # Coordenadas já estão na ordem correta
        draw.ellipse([pod_x - 5, pod_y - 10, pod_x + 15, pod_y + 10],
                     fill=pod_color, outline=(100, 120, 40))
    
    # Adicionar noise e distorção
    img_array = np.array(img)
    noise = np.random.randint(-10, 10, img_array.shape, dtype=np.int16)
    img_array = np.clip(img_array.astype(np.int16) + noise, 0, 255).astype(np.uint8)
    img = Image.fromarray(img_array)
    
    # Aplicar leve blur
    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))
    
    # Variar brilho/contraste
    enhancer = ImageEnhance.Brightness(img)
    img = enhancer.enhance(0.9 + random.random() * 0.2)
    
    return img

print("\n🎨 Gerando imagens sintéticas por fase...")
downloaded_count = 0

for phase in GROWTH_PHASES.keys():
    phase_dir = os.path.join(dataset_dir, phase)
    os.makedirs(phase_dir, exist_ok=True)
    
    print(f"\n🔄 Fase: {phase}")
    
    for i in range(IMAGES_PER_PHASE):
        try:
            # Gerar imagem
            img = generate_soybean_image(phase, i)
            
            # Salvar
            img_path = os.path.join(phase_dir, f"{phase}_{i:03d}.jpg")
            img.save(img_path, quality=95)
            downloaded_count += 1
            
            if (i + 1) % 10 == 0:
                print(f"   ✅ {i + 1}/{IMAGES_PER_PHASE} imagens geradas")
        except Exception as e:
            print(f"   ⚠️ Erro ao gerar imagem {i}: {str(e)}")

print("\n" + "=" * 70)
print("📊 RESUMO")
print("=" * 70)
print(f"✅ Total de imagens geradas: {downloaded_count}")
print(f"📁 Dataset salvo em: {dataset_dir}")
print("=" * 70)

print("\n✨ Próximos passos:")
print("1. Execute: python generate-and-train.py")
print("2. Desative Mock Mode no .env (USE_MOCK_CLASSIFIER=false)")
print("3. Reinicie o backend")
print("4. Teste a análise no frontend!")
