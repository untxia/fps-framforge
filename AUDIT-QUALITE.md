# ✅ Audit qualité — FRAMEFORGE (pré-Lighthouse)

Audit statique réalisé avant mise en ligne. Le vrai audit **Lighthouse** (Chrome DevTools → onglet Lighthouse)
et les tests sur téléphones réels se font une fois le site déployé — checklist en bas.

## Résultats vérifiés
| Point | État |
|---|---|
| Poids du HTML (tout inclus : CSS+JS) | 124 Ko — correct pour un site autonome |
| Images `<img>` | 8 au total, 8 en lazy-loading, toutes avec `decoding=async` |
| Attributs `alt` manquants | 0 |
| Boutons sans type/aria | 8 |
| `preconnect` polices | ✔ présent (Google Fonts, display=swap) |
| Meta description / OG / Twitter / JSON-LD | ✔ présents |
| `hreflang` fr/en | ✔ présent |
| Bascule images locales | ✔ (`data-local` ×15, repli CDN automatique) |
| Effets réduits (`prefers-reduced-motion`) | ✔ respecté partout |
| Focus clavier visibles + skip-link | ✔ |
| Splash mémorisée (1re visite seulement) | ✔ |
| Intensité des effets 3D | réduite d'environ 30 % (passe de sobriété) |

## À faire une fois le site en ligne
1. **Lighthouse** (Chrome → F12 → Lighthouse → Mobile) : viser ≥ 90 en Perf/SEO/A11y ; corriger ce qu'il remonte.
2. Lancer `./telecharge-images.sh` puis convertir en **WebP** (commande affichée par le script) — le site basculera tout seul sur les fichiers locaux.
3. Tester sur **vrais téléphones** (iPhone + Android) : splash, menu burger, configurateur, assistant.
4. Vérifier l'aperçu de partage (og-image) via https://www.opengraph.xyz ou un post Discord test.
