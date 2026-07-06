#!/usr/bin/env bash
# Télécharge les 14 photos du site dans ./images/ (à lancer une fois, sur ta machine).
# Ensuite le site les utilise automatiquement (bascule locale intégrée).
set -e
mkdir -p images
dl(){ echo "-> images/$1"; curl -sL -o "images/$1" "https://images.pexels.com/photos/$2/pexels-photo-$2.jpeg?auto=compress&cs=tinysrgb&w=$3"; }
dl hero.jpg            33693785 1600
dl bg-features.jpg     2582932  1600
dl bg-materiel.jpg     33693786 1600
dl bg-configurateur.jpg 30469967 1600
dl bg-reference.jpg    6974258  1600
dl bg-etapes.jpg       33644890 1600
dl bg-tarifs.jpg       30469973 1600
dl pc.jpg              33644890 1600
dl ram.jpg             34301929 900
dl gpu.jpg             8622911  900
dl cpu.jpg             8033476  900
dl gpu-1.jpg           33022723 800
dl gpu-2.jpg           32728404 800
dl gpu-3.jpg           28743215 800
dl gpu-4.jpg           34552797 800
echo "Terminé : $(ls images | wc -l) images."
echo "Optionnel (WebP, ~30% plus léger) : for f in images/*.jpg; do cwebp -q 82 \"\$f\" -o \"\${f%.jpg}.webp\"; done"
