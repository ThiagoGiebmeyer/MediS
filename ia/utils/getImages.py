from icrawler.builtin import GoogleImageCrawler
import os

fases = {
    "Germinativa": "soybean germination stage photo",
    "Vegetativa": "soybean vegetative stage field photo",
    "Reprodutiva": "soybean reproductive stage plant",
    "Maturacao": "soybean maturation stage plant photo"
}

base_dir = "datasets/Soja/"
num_imagens = 30

filters = {
    "type": "photo",
    "size": "large",
    "license": "noncommercial"
}

for fase, termo in fases.items():
    pasta_destino = os.path.join(base_dir, fase)
    os.makedirs(pasta_destino, exist_ok=True)

    print(f"\n🔍 Baixando imagens para a fase: {fase} ({termo})")
    
    crawler = GoogleImageCrawler(
        feeder_threads=1,
        parser_threads=2,
        downloader_threads=4,
        storage={'root_dir': pasta_destino}
    )
    
    crawler.crawl(
        keyword=termo,
        max_num=num_imagens,
        filters=filters,
        file_idx_offset=0
    )

print("\n✅ Download finalizado! Imagens salvas em 'dataset_soja/' por fase.")
