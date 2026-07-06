# FRAMEFORGE — Mise en production & feuille de route

Ce dossier contient :
- `frameforge.html` — le site complet (à renommer `index.html` pour la mise en ligne).
- `assistant.js` — backend de l'assistant IA (à placer dans `api/`).
- `checkout.js` — backend de paiement Stripe (à placer dans `api/`).

---

## ✅ Déjà fait dans le site
- SEO complet : `<title>`, meta description, Open Graph + Twitter card, favicon, données structurées (JSON-LD), balise theme-color.
- Bannière cookies (consentement) + modales **Mentions légales / Confidentialité / CGV** (textes à compléter avec tes infos — repérés en orange `[À compléter]`).
- Accessibilité : lien « aller au contenu », styles de focus visibles, libellés ARIA.
- Configurateur enrichi : **cartes mères** ajoutées, +30 GPU, +19 CPU, +10 RAM.
- **Lien partageable** (« Partager le lien » encode la config dans l'URL ; elle se recharge à l'ouverture du lien).
- **Profils sauvegardés** (Pro) via le navigateur.
- Sections **Témoignages**, **FAQ** (avec transparence sur le calcul des FPS) et **capture email** (« préviens-moi »).
- Performance du scroll optimisée (lecture/écriture groupées).
- Affichage adaptatif **mobile → 4K → 8K** + menu mobile.

## 🧩 À faire de ton côté (étapes)

### 1. Déploiement (gratuit)
Renomme `frameforge.html` → `index.html`, puis glisse-dépose le dossier sur **Netlify** ou **Vercel**.
→ Les **photos** (Pexels) et tous les effets s'afficheront immédiatement.

### 2. Assistant IA en ligne
1. Place `assistant.js` dans un dossier `api/` à la racine (Vercel) — ou `netlify/functions/`.
2. Crée la variable d'environnement `ANTHROPIC_API_KEY` (depuis console.anthropic.com).
3. Dans `index.html`, remplace l'URL d'appel de l'assistant :
   - cherche `fetch("https://api.anthropic.com/v1/messages"`
   - remplace par `fetch("/api/assistant"` **et retire** le `system`/`model` côté client si tu veux (le serveur les gère). Le plus simple : envoie `{ system, messages }` à `/api/assistant`.
4. Ajoute un **rate limit** (Upstash/Vercel KV) pour éviter les abus.

### 3. Paiement Stripe
1. Crée un compte Stripe → crée 2 produits/prix récurrents : **Pro 4,99€/mois**, **Elite 9,99€/mois**.
2. Place `checkout.js` dans `api/`. Renseigne `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ELITE`, `SITE_URL`.
3. Branche les boutons « Passer en Pro » / « Choisir Elite » sur la fonction `checkout(plan)` (exemple commenté dans `checkout.js`).
4. Crée un **webhook Stripe** pour marquer l'utilisateur comme abonné côté serveur (le déblocage ne doit jamais reposer uniquement sur le JS client).

### 4. Pages légales
Ouvre les modales du footer et remplace tous les `[À compléter]` (éditeur, hébergeur, emails, etc.). Fais relire tes **CGV** si tu encaisses en Europe.

### 5. Analytics
Dans `<head>`, décommente la balise **Plausible** et mets ton domaine (`data-domain`).

---

## 🖼️ Images en local (recommandé pour la prod)
Pour ne plus dépendre du CDN Pexels (plus rapide, plus fiable) : télécharge ces 14 images,
mets-les dans un dossier `images/`, puis remplace dans le HTML les URL `https://images.pexels.com/...`
par `images/<nom>.jpg`. Idéalement convertis-les en **WebP/AVIF** et ajoute `srcset`.

| Fichier conseillé        | Télécharger (clic droit → Enregistrer)                                              |
|--------------------------|--------------------------------------------------------------------------------------|
| hero.jpg                 | https://images.pexels.com/photos/33693785/pexels-photo-33693785.jpeg                |
| bg-features.jpg          | https://images.pexels.com/photos/2582932/pexels-photo-2582932.jpeg                  |
| bg-materiel.jpg          | https://images.pexels.com/photos/33693786/pexels-photo-33693786.jpeg                |
| bg-configurateur.jpg     | https://images.pexels.com/photos/30469967/pexels-photo-30469967.jpeg                |
| bg-reference.jpg         | https://images.pexels.com/photos/6974258/pexels-photo-6974258.jpeg                  |
| bg-etapes.jpg / pc.jpg   | https://images.pexels.com/photos/33644890/pexels-photo-33644890.jpeg                |
| bg-tarifs.jpg            | https://images.pexels.com/photos/30469973/pexels-photo-30469973.jpeg                |
| ram.jpg                  | https://images.pexels.com/photos/34301929/pexels-photo-34301929.jpeg                |
| gpu.jpg                  | https://images.pexels.com/photos/8622911/pexels-photo-8622911.jpeg                  |
| cpu.jpg                  | https://images.pexels.com/photos/8033476/pexels-photo-8033476.jpeg                  |
| gpu-1.jpg                | https://images.pexels.com/photos/33022723/pexels-photo-33022723.jpeg                |
| gpu-2.jpg                | https://images.pexels.com/photos/32728404/pexels-photo-32728404.jpeg                |
| gpu-3.jpg                | https://images.pexels.com/photos/28743215/pexels-photo-28743215.jpeg                |
| gpu-4.jpg                | https://images.pexels.com/photos/34552797/pexels-photo-34552797.jpeg                |

Toutes ces photos sont **Pexels** (libres, usage commercial, sans attribution).

---

## 📊 Vraies données de performance (gros levier de crédibilité)
Aujourd'hui les FPS sont **estimés** par un modèle heuristique (scores relatifs des composants × profil de jeu × résolution × preset). Pour gagner en fiabilité :
- Remplace les scores (`s`) et coefficients de jeu (`gc`, `cc`) par des valeurs issues de **benchmarks réels** (tes tests, ou des bases publiques avec leur autorisation).
- À terme : laisser les utilisateurs **soumettre leurs résultats** (FPS réels) pour calibrer le modèle.
- Garde la mention « estimation » tant que les données ne sont pas validées.

## 🔎 SEO programmatique (croissance organique)
Génère automatiquement **une page par jeu × composant** (ex. `/reglages/cs2-rtx-4060`) à partir de tes données : des centaines de pages qui répondent aux recherches type « meilleurs réglages CS2 RTX 4060 ». Ajoute un `sitemap.xml` et des `<title>`/meta uniques par page. (Idéal avec un petit générateur Node ou un framework comme Astro/Next.)

---

## Checklist finale
- [ ] Renommer en `index.html` et déployer
- [ ] Brancher `api/assistant.js` + clé API + rate limit
- [ ] Stripe : produits, prix, boutons, webhook
- [ ] Compléter mentions légales / CGV / confidentialité
- [ ] Activer Plausible
- [ ] Passer les images en local (WebP) + favicon/og-image définitifs
- [ ] Remplacer les témoignages d'exemple par de vrais avis
- [ ] (Plus tard) vraies données de perf + pages SEO auto
