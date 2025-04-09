from icrawler.builtin import GoogleImageCrawler
import os

# Novas fases com termos mais precisos
fases = {
    "VE": "soybean emergence stage VE",
    "VC": "soybean VC stage cotyledon open",
    "V1": "soybean V1 stage first leaf",
    "V2": "soybean V2 stage first trifoliate",
    "V3": "soybean V3 stage second trifoliate",
    "Vn": "soybean vegetative growth multiple leaves",
    "R1": "soybean R1 stage beginning bloom",
    "R2": "soybean R2 stage full bloom",
    "R3": "soybean R3 stage beginning pod",
    "R4": "soybean R4 stage full pod",
    "R5": "soybean R5 stage beginning seed",
    "R6": "soybean R6 stage full seed",
    "R7": "soybean R7 stage beginning maturity",
    "R8": "soybean R8 stage full maturity"
}

base_dir = "datasets/Soja/"
num_imagens = 50

filters = {
    "type": "photo",
    "size": "large",
    # "license": "noncommercial"
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

print("\n✅ Download finalizado! Imagens salvas em pastas por fase.")
